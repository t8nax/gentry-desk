package worktrees

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"github.com/t8nax/gentry-desk/backend/internal/cli"
)

func TestLoadJoinsTasksAndMissingDetails(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	script := buildFake(t, dir, map[string]reply{
		"project list --json": {
			exit:   0,
			stdout: `{"projects":[{"project":"shop","prefix":"SHOP","knowledge":"D:\\shop-knowledge","main_worktree":"D:\\shop\\main"}]}` + "\n",
		},
		"worktree list --project shop --json": {
			exit: 0,
			stdout: `{"worktrees":[
				{"path":"D:\\shop\\main","project":"shop","main":true,"exists":true,"branch":"main","task":"SHOP-1"},
				{"path":"D:\\shop\\wt-1","project":"shop","main":false,"exists":true},
				{"path":"D:\\shop\\missing","project":"shop","main":false,"exists":false,"task":"SHOP-9"},
				{"path":"D:\\shop\\no-branch","project":"shop","main":false,"exists":true}
			]}` + "\n",
		},
		"task list --project shop --json": {
			exit: 0,
			stdout: `{"tasks":[{
				"id":"SHOP-1","attempt":1,"project":"shop","title":"Скидка",
				"state":"active","scenario":{"id":"feature","title":"Фича"},
				"stage":{"node":"implementation","id":"implementation","title":"Реализация","round":2},
				"finished":false,"progress":{"passed":3,"total_min":3,"total_max":5},
				"worktree":"D:\\shop\\main","taken":"2026-10-09T13:16:27.714Z"
			}]}` + "\n",
		},
	})

	svc := &Service{CLI: &cli.Runner{Path: script, Timeout: 10 * time.Second}}
	screen, err := svc.Load(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(screen.Projects) != 1 || len(screen.Rows) != 4 {
		t.Fatalf("projects=%d rows=%d", len(screen.Projects), len(screen.Rows))
	}

	busy := screen.Rows[0]
	if busy.Occupancy != "busy" || busy.Task == nil || busy.Task.Title == nil || *busy.Task.Title != "Скидка" {
		t.Fatalf("busy row: %+v", busy)
	}
	if busy.Task.Percent == nil || *busy.Task.Percent != 60 {
		t.Fatalf("percent: %v", busy.Task.Percent)
	}
	if busy.Task.Stage == nil || busy.Task.Stage.Round != 2 {
		t.Fatalf("stage: %+v", busy.Task.Stage)
	}

	free := screen.Rows[1]
	if free.Occupancy != "free" || free.Task != nil {
		t.Fatalf("free row: %+v", free)
	}

	missing := screen.Rows[2]
	if missing.Exists || missing.Occupancy != "busy" || missing.Task == nil {
		t.Fatalf("missing busy: %+v", missing)
	}
	if !missing.Task.DetailsUnavailable || missing.Task.ID != "SHOP-9" {
		t.Fatalf("unavailable: %+v", missing.Task)
	}

	noBranch := screen.Rows[3]
	if noBranch.Branch != nil {
		t.Fatalf("branch should be absent, got %v", *noBranch.Branch)
	}
}

func TestLoadFinishedScenarioStage(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	script := buildFake(t, dir, map[string]reply{
		"project list --json": {
			exit:   0,
			stdout: `{"projects":[{"project":"shop","prefix":"SHOP","knowledge":"D:\\k","main_worktree":"D:\\shop\\main"}]}` + "\n",
		},
		"worktree list --project shop --json": {
			exit:   0,
			stdout: `{"worktrees":[{"path":"D:\\shop\\main","project":"shop","main":true,"exists":true,"task":"SHOP-2"}]}` + "\n",
		},
		"task list --project shop --json": {
			exit: 0,
			stdout: `{"tasks":[{
				"id":"SHOP-2","attempt":1,"project":"shop","title":"Оплата",
				"state":"active","scenario":{"id":"feature","title":"Фича"},
				"finished":true,"progress":{"passed":3,"total_min":3,"total_max":3},
				"worktree":"D:\\shop\\main","taken":"2026-10-09T13:16:27.714Z"
			}]}` + "\n",
		},
	})
	svc := &Service{CLI: &cli.Runner{Path: script, Timeout: 10 * time.Second}}
	screen, err := svc.Load(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	task := screen.Rows[0].Task
	if task == nil || task.Stage != nil || task.Finished == nil || !*task.Finished {
		t.Fatalf("finished task: %+v", task)
	}
	if task.Percent == nil || *task.Percent != 100 {
		t.Fatalf("percent: %v", task.Percent)
	}
}

func TestAddUnchangedWithAgents(t *testing.T) {
	t.Parallel()
	dir := t.TempDir()
	script := buildFake(t, dir, map[string]reply{
		`worktree add C:\shop\wt 2 --project shop --json`: {
			exit: 0,
			stdout: `{"path":"C:\\shop\\wt 2","project":"shop","main":false,"action":"unchanged",
				"agents":{"worktrees":[],"conflicts":[{"worktree":"C:\\shop\\wt 2","agent":"reviewer","file":".claude/agents/reviewer.md","reason":"foreign"}],"error":"layout failed"}}` + "\n",
		},
	})
	svc := &Service{CLI: &cli.Runner{Path: script, Timeout: 10 * time.Second}}
	res, err := svc.Add(context.Background(), AddRequest{Project: "shop", Path: `C:\shop\wt 2`})
	if err != nil {
		t.Fatal(err)
	}
	if res.Action != "unchanged" {
		t.Fatalf("action: %s", res.Action)
	}
	if res.Agents == nil || res.Agents.Error == nil {
		t.Fatalf("agents: %+v", res.Agents)
	}
}

type reply struct {
	exit   int
	stdout string
}

func buildFake(t *testing.T, dir string, replies map[string]reply) string {
	t.Helper()
	type fileReply struct {
		Exit   int    `json:"exit"`
		Stdout string `json:"stdout"`
	}
	shaped := make(map[string]fileReply, len(replies))
	for k, v := range replies {
		shaped[k] = fileReply{Exit: v.exit, Stdout: v.stdout}
	}
	raw, err := json.Marshal(shaped)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "replies.json"), raw, 0o644); err != nil {
		t.Fatal(err)
	}
	src := filepath.Join(dir, "fake.go")
	code := `package main
import ("encoding/json"; "os"; "path/filepath"; "strings")
type reply struct { Exit int ` + "`json:\"exit\"`" + `; Stdout string ` + "`json:\"stdout\"`" + ` }
func main() {
  exe, _ := os.Executable()
  raw, err := os.ReadFile(filepath.Join(filepath.Dir(exe), "replies.json"))
  if err != nil { os.Stderr.WriteString(err.Error()); os.Exit(2) }
  var replies map[string]reply
  if err := json.Unmarshal(raw, &replies); err != nil { os.Stderr.WriteString(err.Error()); os.Exit(2) }
  key := strings.Join(os.Args[1:], " ")
  r, ok := replies[key]
  if !ok { os.Stderr.WriteString("unexpected: "+key); os.Exit(2) }
  os.Stdout.WriteString(r.Stdout)
  os.Exit(r.Exit)
}`
	if err := os.WriteFile(src, []byte(code), 0o644); err != nil {
		t.Fatal(err)
	}
	out := filepath.Join(dir, "fake")
	if runtime.GOOS == "windows" {
		out += ".exe"
	}
	cmd := exec.Command("go", "build", "-o", out, src)
	cmd.Dir = dir
	if b, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("build: %v\n%s", err, b)
	}
	return out
}
