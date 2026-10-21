// Package worktrees assembles the «Рабочие копии» screen from Gentry CLI lists.
package worktrees

import (
	"context"
	"fmt"
	"math"

	"github.com/t8nax/gentry-desk/backend/internal/cli"
	"github.com/t8nax/gentry/contract"
)

// Service loads projects, worktrees and open tasks and joins them for the UI.
type Service struct {
	CLI *cli.Runner
}

// Project is a connected project as shown on the screen.
type Project struct {
	Project      string `json:"project"`
	Prefix       string `json:"prefix"`
	Knowledge    string `json:"knowledge"`
	MainWorktree string `json:"main_worktree"`
}

// TaskProgress keeps the original scenario progress fields from Gentry.
type TaskProgress struct {
	Passed   int `json:"passed"`
	TotalMin int `json:"total_min"`
	TotalMax int `json:"total_max"`
}

// TaskStage is the current stage when the scenario is not finished.
type TaskStage struct {
	Node  string `json:"node"`
	ID    string `json:"id"`
	Title string `json:"title"`
	Round int    `json:"round"`
}

// Task is the task pinned to a worktree, or a stub when the list missed it.
type Task struct {
	ID       string        `json:"id"`
	Title    *string       `json:"title"`
	Finished *bool         `json:"finished"`
	Stage    *TaskStage    `json:"stage"`
	Progress *TaskProgress `json:"progress"`
	// Percent is round(100×passed/total_max), clamped 0–100; null when unknown.
	Percent *int `json:"percent"`
	// DetailsUnavailable is true when worktree.task was set but the task list
	// did not contain that id (lists are not one snapshot).
	DetailsUnavailable bool `json:"details_unavailable"`
}

// Row is one worktree line for the table.
type Row struct {
	Project   string  `json:"project"`
	Knowledge string  `json:"knowledge"`
	Path      string  `json:"path"`
	Branch    *string `json:"branch"`
	Main      bool    `json:"main"`
	Exists    bool    `json:"exists"`
	// Occupancy is "busy" when a task is pinned, else "free".
	Occupancy string `json:"occupancy"`
	Task      *Task  `json:"task"`
}

// Screen is the GET /api/worktrees payload.
type Screen struct {
	Projects []Project `json:"projects"`
	Rows     []Row     `json:"rows"`
}

// AddRequest is the body of POST /api/worktrees.
type AddRequest struct {
	Project string `json:"project"`
	Path    string `json:"path"`
}

// AddResult is the POST /api/worktrees success payload.
type AddResult struct {
	Path    string                 `json:"path"`
	Project string                 `json:"project"`
	Main    bool                   `json:"main"`
	Action  string                 `json:"action"`
	Agents  *contract.AgentsLayout `json:"agents,omitempty"`
}

// Load builds the screen: project list, then per project worktree list + task list.
func (s *Service) Load(ctx context.Context) (*Screen, error) {
	var projectsOut contract.ProjectListOutput
	if err := s.CLI.Run(ctx, &projectsOut, "project", "list"); err != nil {
		return nil, fmt.Errorf("load projects: %w", err)
	}

	screen := &Screen{
		Projects: make([]Project, 0, len(projectsOut.Projects)),
		Rows:     make([]Row, 0),
	}

	for _, p := range projectsOut.Projects {
		screen.Projects = append(screen.Projects, Project{
			Project:      p.Project,
			Prefix:       p.Prefix,
			Knowledge:    p.Knowledge,
			MainWorktree: p.MainWorktree,
		})

		var wtOut contract.WorktreeListOutput
		if err := s.CLI.Run(ctx, &wtOut, "worktree", "list", "--project", p.Project); err != nil {
			return nil, fmt.Errorf("load worktrees for %s: %w", p.Project, err)
		}

		var taskOut contract.TaskListOutput
		if err := s.CLI.Run(ctx, &taskOut, "task", "list", "--project", p.Project); err != nil {
			return nil, fmt.Errorf("load tasks for %s: %w", p.Project, err)
		}

		byID := make(map[string]contract.TaskListItem, len(taskOut.Tasks))
		for _, t := range taskOut.Tasks {
			byID[t.Id] = t
		}

		for _, wt := range wtOut.Worktrees {
			row := Row{
				Project:   p.Project,
				Knowledge: p.Knowledge,
				Path:      wt.Path,
				Branch:    wt.Branch,
				Main:      wt.Main,
				Exists:    wt.Exists,
				Occupancy: "free",
			}
			if wt.Task != nil && *wt.Task != "" {
				row.Occupancy = "busy"
				row.Task = joinTask(*wt.Task, byID)
			}
			screen.Rows = append(screen.Rows, row)
		}
	}

	return screen, nil
}

func joinTask(id string, byID map[string]contract.TaskListItem) *Task {
	t, ok := byID[id]
	if !ok {
		return &Task{ID: id, DetailsUnavailable: true}
	}
	task := &Task{
		ID:       t.Id,
		Title:    strPtr(t.Title),
		Finished: boolPtr(t.Finished),
		Progress: &TaskProgress{
			Passed:   t.Progress.Passed,
			TotalMin: t.Progress.TotalMin,
			TotalMax: t.Progress.TotalMax,
		},
		Percent: Percent(t.Finished, t.Progress),
	}
	if t.Stage != nil {
		task.Stage = &TaskStage{
			Node:  t.Stage.Node,
			ID:    t.Stage.Id,
			Title: t.Stage.Title,
			Round: t.Stage.Round,
		}
	}
	return task
}

// Percent is the presentation rule: round(100×passed/total_max), 0–100;
// 100 when finished; null when total_max is 0 and the scenario is not finished.
func Percent(finished bool, p contract.TaskProgress) *int {
	if finished {
		v := 100
		return &v
	}
	if p.TotalMax == 0 {
		return nil
	}
	v := int(math.Round(100 * float64(p.Passed) / float64(p.TotalMax)))
	if v < 0 {
		v = 0
	}
	if v > 100 {
		v = 100
	}
	return &v
}

// Add registers an existing directory in the project pool.
func (s *Service) Add(ctx context.Context, req AddRequest) (*AddResult, error) {
	var out contract.WorktreeAddOutput
	if err := s.CLI.Run(ctx, &out, "worktree", "add", req.Path, "--project", req.Project); err != nil {
		return nil, fmt.Errorf("add worktree: %w", err)
	}
	return &AddResult{
		Path:    out.Path,
		Project: out.Project,
		Main:    out.Main,
		Action:  out.Action,
		Agents:  out.Agents,
	}, nil
}

func strPtr(s string) *string { return &s }
func boolPtr(b bool) *bool    { return &b }
