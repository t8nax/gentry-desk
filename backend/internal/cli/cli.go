// Package cli runs the Gentry program with --json and maps exit codes to errors.
package cli

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"time"

	"github.com/t8nax/gentry/contract"
)

// Codes for failures that happen before or around a Gentry ErrorOutput.
const (
	CodeNotFound     = "gentry_not_found"
	CodeTimeout      = "gentry_timeout"
	CodeInvalidJSON  = "gentry_invalid_json"
	CodeContract     = "contract_unsupported"
	CodeFailed       = "gentry_failed"
	CodeCanceled     = "gentry_canceled"
)

// DefaultTimeout is used when a call does not set its own deadline.
const DefaultTimeout = 30 * time.Second

// Env vars stripped from the child so a desk started inside Claude Code
// still talks to Gentry as the operator.
var stripEnv = map[string]struct{}{
	"CLAUDECODE":     {},
	"GENTRY_SESSION": {},
}

// Runner executes gentry with separate argv (no shell).
type Runner struct {
	// Path is the gentry executable; empty means look up "gentry" on PATH.
	Path string
	// Timeout applies when the request context has no deadline.
	Timeout time.Duration
	// LookPath finds an executable on PATH; tests replace it.
	LookPath func(file string) (string, error)
	// Command builds the process; tests replace it.
	Command func(ctx context.Context, name string, arg ...string) *exec.Cmd
}

func (r *Runner) path() string {
	if r.Path != "" {
		return r.Path
	}
	return "gentry"
}

func (r *Runner) timeout() time.Duration {
	if r.Timeout > 0 {
		return r.Timeout
	}
	return DefaultTimeout
}

func (r *Runner) lookPath(file string) (string, error) {
	if r.LookPath != nil {
		return r.LookPath(file)
	}
	return exec.LookPath(file)
}

func (r *Runner) command(ctx context.Context, name string, arg ...string) *exec.Cmd {
	if r.Command != nil {
		return r.Command(ctx, name, arg...)
	}
	return exec.CommandContext(ctx, name, arg...)
}

// Error is a failure of a gentry call, suitable for the desk HTTP API.
type Error struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
	Hint    *string `json:"hint,omitempty"`
	// ExitCode is the process exit code when known; -1 otherwise.
	ExitCode int `json:"-"`
	// Stderr is diagnostic text from the child; not for the operator UI.
	Stderr string `json:"-"`
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}
	return e.Message
}

func apiErr(code, message string, hint *string) *Error {
	return &Error{Code: code, Message: message, Hint: hint, ExitCode: -1}
}

// Run executes `gentry <args...> --json`, unmarshals stdout into dest on success.
func (r *Runner) Run(ctx context.Context, dest any, args ...string) error {
	exe, err := r.lookPath(r.path())
	if err != nil {
		return apiErr(CodeNotFound, "Программа Gentry не найдена в PATH.", strPtr("Установите gentry и добавьте его в PATH, либо задайте GENTRY."))
	}

	if _, ok := ctx.Deadline(); !ok {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(ctx, r.timeout())
		defer cancel()
	}

	argv := append(append([]string{}, args...), "--json")
	cmd := r.command(ctx, exe, argv...)
	cmd.Env = filteredEnv(os.Environ())
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	runErr := cmd.Run()
	outBytes := bytes.TrimSpace(stdout.Bytes())
	errText := strings.TrimSpace(stderr.String())

	if errors.Is(ctx.Err(), context.DeadlineExceeded) {
		return apiErr(CodeTimeout, "Команда Gentry не уложилась в отведённое время.", nil)
	}
	if errors.Is(ctx.Err(), context.Canceled) {
		return apiErr(CodeCanceled, "Запрос отменён.", nil)
	}

	exitCode := 0
	if runErr != nil {
		var ee *exec.ExitError
		if errors.As(runErr, &ee) {
			exitCode = ee.ExitCode()
		} else {
			return &Error{
				Code:     CodeFailed,
				Message:  fmt.Sprintf("Не удалось запустить Gentry: %v", runErr),
				ExitCode: -1,
				Stderr:   errText,
			}
		}
	}

	if exitCode != contract.ExitOK {
		if len(outBytes) > 0 {
			var eo contract.ErrorOutput
			if err := json.Unmarshal(outBytes, &eo); err == nil && eo.Error.Code != "" {
				return &Error{
					Code:     eo.Error.Code,
					Message:  eo.Error.Message,
					Hint:     eo.Error.Hint,
					ExitCode: exitCode,
					Stderr:   errText,
				}
			}
		}
		msg := "Команда Gentry завершилась с ошибкой."
		if errText != "" {
			msg = errText
		}
		return &Error{Code: CodeFailed, Message: msg, ExitCode: exitCode, Stderr: errText}
	}

	if dest == nil {
		return nil
	}
	if len(outBytes) == 0 {
		return apiErr(CodeInvalidJSON, "Gentry вернул пустой ответ.", nil)
	}
	if err := json.Unmarshal(outBytes, dest); err != nil {
		return apiErr(CodeInvalidJSON, "Ответ Gentry не является корректным JSON.", strPtr(err.Error()))
	}
	return nil
}

// CheckVersion runs `gentry version --json` and ensures the contract version matches.
func (r *Runner) CheckVersion(ctx context.Context) (*contract.VersionOutput, error) {
	var ver contract.VersionOutput
	if err := r.Run(ctx, &ver, "version"); err != nil {
		return nil, err
	}
	if ver.Contract != contract.Version {
		hint := fmt.Sprintf("Панель ожидает контракт %d, Gentry сообщает %d. Обновите Gentry или панель.", contract.Version, ver.Contract)
		return &ver, apiErr(CodeContract, "Версия контракта Gentry не поддерживается этой панелью.", &hint)
	}
	return &ver, nil
}

func filteredEnv(environ []string) []string {
	out := make([]string, 0, len(environ))
	for _, kv := range environ {
		key, _, _ := strings.Cut(kv, "=")
		if _, drop := stripEnv[key]; drop {
			continue
		}
		out = append(out, kv)
	}
	return out
}

func strPtr(s string) *string { return &s }
