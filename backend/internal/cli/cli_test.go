package cli

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"
)

func TestFilteredEnvStripsSessionVars(t *testing.T) {
	t.Parallel()
	in := []string{
		"PATH=/bin",
		"GENTRY_HOME=/tmp/home",
		"CLAUDECODE=1",
		"GENTRY_SESSION=abc",
		"HOME=/home/u",
	}
	out := filteredEnv(in)
	joined := strings.Join(out, "\n")
	if strings.Contains(joined, "CLAUDECODE=") {
		t.Fatal("CLAUDECODE must be stripped")
	}
	if strings.Contains(joined, "GENTRY_SESSION=") {
		t.Fatal("GENTRY_SESSION must be stripped")
	}
	if !strings.Contains(joined, "GENTRY_HOME=") {
		t.Fatal("GENTRY_HOME must be kept")
	}
}

func TestRunSuccessAndErrorOutput(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	script := fakeGentry(t, dir, map[string]fakeReply{
		"version --json": {
			exit:   0,
			stdout: `{"gentry":"0.1.0","contract":0,"state_schema":8,"knowledge_format":1}` + "\n",
		},
		"project list --json": {
			exit:   1,
			stdout: `{"error":{"code":"state_unavailable","message":"База недоступна.","hint":"Повторите позже"}}` + "\n",
		},
		`worktree add C:\path with spaces\wt --project shop --json`: {
			exit:   0,
			stdout: `{"path":"C:\\path with spaces\\wt","project":"shop","main":false,"action":"added"}` + "\n",
		},
	})

	r := &Runner{Path: script, Timeout: 5 * time.Second}

	var ver map[string]any
	if err := r.Run(context.Background(), &ver, "version"); err != nil {
		t.Fatalf("version: %v", err)
	}
	if ver["contract"].(float64) != 0 {
		t.Fatalf("contract: %v", ver["contract"])
	}

	err := r.Run(context.Background(), &struct{}{}, "project", "list")
	ce, ok := err.(*Error)
	if !ok {
		t.Fatalf("want *Error, got %T %v", err, err)
	}
	if ce.Code != "state_unavailable" {
		t.Fatalf("code: %s", ce.Code)
	}
	if ce.Hint == nil || *ce.Hint != "Повторите позже" {
		t.Fatalf("hint: %v", ce.Hint)
	}

	var add map[string]any
	if err := r.Run(context.Background(), &add, "worktree", "add", `C:\path with spaces\wt`, "--project", "shop"); err != nil {
		t.Fatalf("add with spaces: %v", err)
	}
	if add["action"] != "added" {
		t.Fatalf("action: %v", add["action"])
	}
}

func TestRunNotFound(t *testing.T) {
	t.Parallel()
	r := &Runner{
		Path: "gentry-does-not-exist-xyz",
		LookPath: func(string) (string, error) {
			return "", exec.ErrNotFound
		},
	}
	err := r.Run(context.Background(), nil, "version")
	ce, ok := err.(*Error)
	if !ok || ce.Code != CodeNotFound {
		t.Fatalf("want not found, got %v", err)
	}
}

func TestCheckVersionMismatch(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	script := fakeGentry(t, dir, map[string]fakeReply{
		"version --json": {
			exit:   0,
			stdout: `{"gentry":"9.0.0","contract":99,"state_schema":8,"knowledge_format":1}` + "\n",
		},
	})
	r := &Runner{Path: script}
	_, err := r.CheckVersion(context.Background())
	ce, ok := err.(*Error)
	if !ok || ce.Code != CodeContract {
		t.Fatalf("want contract error, got %v", err)
	}
}

type fakeReply struct {
	exit   int
	stdout string
	stderr string
}

func fakeGentry(t *testing.T, dir string, replies map[string]fakeReply) string {
	t.Helper()
	type fileReply struct {
		Exit   int    `json:"exit"`
		Stdout string `json:"stdout"`
		Stderr string `json:"stderr"`
	}
	shaped := make(map[string]fileReply, len(replies))
	for k, v := range replies {
		shaped[k] = fileReply{Exit: v.exit, Stdout: v.stdout, Stderr: v.stderr}
	}
	repliesPath := filepath.Join(dir, "replies.json")
	raw, err := json.Marshal(shaped)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(repliesPath, raw, 0o644); err != nil {
		t.Fatal(err)
	}

	src := filepath.Join(dir, "fake_gentry.go")
	content := `package main
import (
  "encoding/json"
  "os"
  "path/filepath"
  "strings"
)
type reply struct {
  Exit int ` + "`json:\"exit\"`" + `
  Stdout string ` + "`json:\"stdout\"`" + `
  Stderr string ` + "`json:\"stderr\"`" + `
}
func main() {
  exe, _ := os.Executable()
  raw, err := os.ReadFile(filepath.Join(filepath.Dir(exe), "replies.json"))
  if err != nil { os.Stderr.WriteString(err.Error()); os.Exit(2) }
  var replies map[string]reply
  if err := json.Unmarshal(raw, &replies); err != nil { os.Stderr.WriteString(err.Error()); os.Exit(2) }
  key := strings.Join(os.Args[1:], " ")
  r, ok := replies[key]
  if !ok {
    os.Stderr.WriteString("unexpected argv: "+key+"\n")
    os.Exit(2)
  }
  os.Stdout.WriteString(r.Stdout)
  os.Stderr.WriteString(r.Stderr)
  os.Exit(r.Exit)
}
`
	if err := os.WriteFile(src, []byte(content), 0o644); err != nil {
		t.Fatal(err)
	}
	out := filepath.Join(dir, "fake-gentry")
	if runtime.GOOS == "windows" {
		out += ".exe"
	}
	cmd := exec.Command("go", "build", "-o", out, src)
	cmd.Dir = dir
	if b, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("build fake gentry: %v\n%s", err, b)
	}
	return out
}
