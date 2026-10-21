// Package api is the HTTP surface of Gentry Desk for the worktrees screen.
package api

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/t8nax/gentry-desk/backend/internal/cli"
	"github.com/t8nax/gentry-desk/backend/internal/worktrees"
)

// WorktreeService is the screen use-case used by HTTP handlers.
type WorktreeService interface {
	Load(ctx context.Context) (*worktrees.Screen, error)
	Add(ctx context.Context, req worktrees.AddRequest) (*worktrees.AddResult, error)
}

// Server serves the desk API on loopback.
type Server struct {
	Worktrees WorktreeService
	CLI       *cli.Runner
	// Addr is the listen address; default 127.0.0.1:8787.
	Addr string
	// AllowedOrigins for CORS and CSRF checks (Vite default included).
	AllowedOrigins []string
	// ReadOnly is set when the Gentry contract version is unsupported:
	// GET works, mutating methods are refused.
	ReadOnly     bool
	ContractHint string
}

func (s *Server) addr() string {
	if s.Addr != "" {
		return s.Addr
	}
	return "127.0.0.1:8787"
}

func (s *Server) origins() []string {
	if len(s.AllowedOrigins) > 0 {
		return s.AllowedOrigins
	}
	return []string{
		"http://127.0.0.1:5173",
		"http://localhost:5173",
	}
}

// Handler returns the root mux.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", s.handleHealth)
	mux.HandleFunc("GET /api/worktrees", s.handleList)
	mux.HandleFunc("POST /api/worktrees", s.handleAdd)
	return s.withMiddleware(mux)
}

func (s *Server) withMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && s.originAllowed(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodGet && r.Method != http.MethodHead {
			if err := s.checkMutatingOrigin(r); err != nil {
				writeError(w, http.StatusForbidden, &cli.Error{
					Code:    "csrf_rejected",
					Message: "Запрос отклонён: посторонний источник.",
				})
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) originAllowed(origin string) bool {
	for _, allowed := range s.origins() {
		if origin == allowed {
			return true
		}
	}
	return false
}

// checkMutatingOrigin blocks cross-site POSTs to the local API.
func (s *Server) checkMutatingOrigin(r *http.Request) error {
	origin := r.Header.Get("Origin")
	if origin != "" {
		if s.originAllowed(origin) {
			return nil
		}
		return errors.New("bad origin")
	}
	referer := r.Header.Get("Referer")
	if referer != "" {
		u, err := url.Parse(referer)
		if err != nil {
			return errors.New("bad referer")
		}
		refOrigin := u.Scheme + "://" + u.Host
		if s.originAllowed(refOrigin) {
			return nil
		}
		return errors.New("bad referer")
	}
	// Non-browser clients (curl, tests) send neither Origin nor Referer.
	site := r.Header.Get("Sec-Fetch-Site")
	switch site {
	case "", "none", "same-origin", "same-site":
		return nil
	default:
		return errors.New("bad fetch site")
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleList(w http.ResponseWriter, r *http.Request) {
	screen, err := s.Worktrees.Load(r.Context())
	if err != nil {
		writeCLIError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, screen)
}

func (s *Server) handleAdd(w http.ResponseWriter, r *http.Request) {
	if s.ReadOnly {
		hint := s.ContractHint
		writeError(w, http.StatusConflict, &cli.Error{
			Code:    cli.CodeContract,
			Message: "Версия контракта Gentry не поддерживается: доступен только просмотр.",
			Hint:    &hint,
		})
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	var req worktrees.AddRequest
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, &cli.Error{
			Code:    "input_invalid",
			Message: "Тело запроса должно быть JSON с полями project и path.",
		})
		return
	}
	req.Project = strings.TrimSpace(req.Project)
	req.Path = strings.TrimSpace(req.Path)
	if req.Project == "" || req.Path == "" {
		writeError(w, http.StatusBadRequest, &cli.Error{
			Code:    "input_invalid",
			Message: "Укажите project и path.",
		})
		return
	}
	result, err := s.Worktrees.Add(r.Context(), req)
	if err != nil {
		writeCLIError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func writeCLIError(w http.ResponseWriter, err error) {
	var ce *cli.Error
	if errors.As(err, &ce) {
		status := http.StatusBadGateway
		switch ce.Code {
		case cli.CodeNotFound:
			status = http.StatusServiceUnavailable
		case cli.CodeTimeout, cli.CodeCanceled:
			status = http.StatusGatewayTimeout
		case cli.CodeContract:
			status = http.StatusConflict
		default:
			// Structured Gentry errors are operator-facing failures of the command.
			if ce.ExitCode == 1 || ce.ExitCode == 2 {
				status = http.StatusUnprocessableEntity
			}
		}
		writeError(w, status, ce)
		return
	}
	writeError(w, http.StatusInternalServerError, &cli.Error{
		Code:    "internal",
		Message: "Внутренняя ошибка панели.",
	})
}

type errorBody struct {
	Error errorPayload `json:"error"`
}

type errorPayload struct {
	Code    string  `json:"code"`
	Message string  `json:"message"`
	Hint    *string `json:"hint,omitempty"`
}

func writeError(w http.ResponseWriter, status int, err *cli.Error) {
	writeJSON(w, status, errorBody{Error: errorPayload{
		Code:    err.Code,
		Message: err.Message,
		Hint:    err.Hint,
	}})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

// ListenAndServe binds loopback only and serves until ctx is cancelled.
func (s *Server) ListenAndServe(ctx context.Context) error {
	addr := s.addr()
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		return err
	}
	if ip := net.ParseIP(host); ip == nil || !ip.IsLoopback() {
		return errors.New("server must listen on a loopback address")
	}

	if ver, err := s.CLI.CheckVersion(ctx); err != nil {
		var ce *cli.Error
		if errors.As(err, &ce) && ce.Code == cli.CodeContract {
			s.ReadOnly = true
			s.ContractHint = deref(ce.Hint)
			log.Printf("warning: contract mismatch (read-only): gentry=%s contract=%d — %s", ver.Gentry, ver.Contract, s.ContractHint)
		} else {
			return err
		}
	}

	srv := &http.Server{
		Addr:              addr,
		Handler:           s.Handler(),
		ReadHeaderTimeout: 5 * time.Second,
		BaseContext:       func(net.Listener) context.Context { return ctx },
	}

	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	log.Printf("gentry-desk listening on http://%s", addr)

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Serve(ln)
	}()

	select {
	case <-ctx.Done():
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(shutdownCtx)
		return nil
	case err := <-errCh:
		if errors.Is(err, http.ErrServerClosed) {
			return nil
		}
		return err
	}
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
