package api

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/t8nax/gentry-desk/backend/internal/cli"
	"github.com/t8nax/gentry-desk/backend/internal/folderpick"
	"github.com/t8nax/gentry-desk/backend/internal/worktrees"
)

type stubWorktrees struct {
	screen  *worktrees.Screen
	loadErr error
	add     *worktrees.AddResult
	addErr  error
	lastAdd worktrees.AddRequest
}

func (s *stubWorktrees) Load(context.Context) (*worktrees.Screen, error) {
	return s.screen, s.loadErr
}

func (s *stubWorktrees) Add(_ context.Context, req worktrees.AddRequest) (*worktrees.AddResult, error) {
	s.lastAdd = req
	return s.add, s.addErr
}

type stubFolders struct {
	result folderpick.Result
	err    error
}

func (s *stubFolders) Pick(context.Context) (folderpick.Result, error) {
	return s.result, s.err
}

func TestHealthOK(t *testing.T) {
	t.Parallel()
	srv := &Server{Worktrees: &stubWorktrees{}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/health", nil)
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d want 200", rec.Code)
	}
	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "ok" {
		t.Fatalf("body=%v", body)
	}
}

func TestListOK(t *testing.T) {
	t.Parallel()
	screen := &worktrees.Screen{
		Projects: []worktrees.Project{{Project: "p", Knowledge: "k"}},
		Rows:     []worktrees.Row{},
	}
	srv := &Server{Worktrees: &stubWorktrees{screen: screen}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/worktrees", nil)
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var got worktrees.Screen
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if len(got.Projects) != 1 || got.Projects[0].Project != "p" {
		t.Fatalf("projects=%v", got.Projects)
	}
}

func TestCSRFRejected(t *testing.T) {
	t.Parallel()
	srv := &Server{Worktrees: &stubWorktrees{}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/worktrees", strings.NewReader(`{}`))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "https://evil.example")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("status=%d want 403", rec.Code)
	}
	assertErrorCode(t, rec, "csrf_rejected")
}

func TestAddReadOnlyConflict(t *testing.T) {
	t.Parallel()
	srv := &Server{
		Worktrees:    &stubWorktrees{},
		ReadOnly:     true,
		ContractHint: "upgrade gentry",
	}
	rec := httptest.NewRecorder()
	body := `{"project":"p","path":"C:\\wt"}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/worktrees", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusConflict {
		t.Fatalf("status=%d want 409 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, cli.CodeContract)
}

func TestAddValidationEmpty(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name string
		body string
	}{
		{name: "empty fields", body: `{"project":"","path":""}`},
		{name: "missing path", body: `{"project":"p"}`},
		{name: "invalid json", body: `{`},
		{name: "unknown field", body: `{"project":"p","path":"x","extra":1}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			srv := &Server{Worktrees: &stubWorktrees{}}
			rec := httptest.NewRecorder()
			req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/worktrees", strings.NewReader(tc.body))
			req.Header.Set("Content-Type", "application/json")
			srv.Handler().ServeHTTP(rec, req)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status=%d want 400 body=%s", rec.Code, rec.Body.String())
			}
			assertErrorCode(t, rec, "input_invalid")
		})
	}
}

func TestAddOK(t *testing.T) {
	t.Parallel()
	stub := &stubWorktrees{
		add: &worktrees.AddResult{Path: `C:\wt`, Project: "p", Main: false, Action: "added"},
	}
	srv := &Server{Worktrees: stub}
	rec := httptest.NewRecorder()
	body := `{"project":" p ","path":" C:\\wt "}`
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/worktrees", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	if stub.lastAdd.Project != "p" || stub.lastAdd.Path != `C:\wt` {
		t.Fatalf("lastAdd=%+v", stub.lastAdd)
	}
	var got worktrees.AddResult
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.Action != "added" || got.Path != `C:\wt` {
		t.Fatalf("got=%+v", got)
	}
}

func TestWriteCLIErrorStatuses(t *testing.T) {
	t.Parallel()
	cases := []struct {
		name   string
		err    error
		status int
		code   string
	}{
		{
			name:   "not found",
			err:    &cli.Error{Code: cli.CodeNotFound, Message: "missing"},
			status: http.StatusServiceUnavailable,
			code:   cli.CodeNotFound,
		},
		{
			name:   "timeout",
			err:    &cli.Error{Code: cli.CodeTimeout, Message: "slow"},
			status: http.StatusGatewayTimeout,
			code:   cli.CodeTimeout,
		},
		{
			name:   "contract",
			err:    &cli.Error{Code: cli.CodeContract, Message: "old"},
			status: http.StatusConflict,
			code:   cli.CodeContract,
		},
		{
			name:   "exit 1",
			err:    &cli.Error{Code: "project_not_found", Message: "нет", ExitCode: 1},
			status: http.StatusUnprocessableEntity,
			code:   "project_not_found",
		},
		{
			name:   "wrapped cli error",
			err:    fmt.Errorf("load projects: %w", &cli.Error{Code: cli.CodeNotFound, Message: "missing"}),
			status: http.StatusServiceUnavailable,
			code:   cli.CodeNotFound,
		},
		{
			name:   "internal",
			err:    errors.New("boom"),
			status: http.StatusInternalServerError,
			code:   "internal",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			srv := &Server{Worktrees: &stubWorktrees{loadErr: tc.err}}
			rec := httptest.NewRecorder()
			req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/api/worktrees", nil)
			srv.Handler().ServeHTTP(rec, req)
			if rec.Code != tc.status {
				t.Fatalf("status=%d want %d body=%s", rec.Code, tc.status, rec.Body.String())
			}
			assertErrorCode(t, rec, tc.code)
		})
	}
}

func TestAddBodyTooLarge(t *testing.T) {
	t.Parallel()
	srv := &Server{Worktrees: &stubWorktrees{}}
	payload := `{"project":"p","path":"` + strings.Repeat("x", 70<<10) + `"}`
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/worktrees", bytes.NewBufferString(payload))
	req.Header.Set("Content-Type", "application/json")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status=%d want 400 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, "input_invalid")
}

func TestPickFolderOK(t *testing.T) {
	t.Parallel()
	path := `C:\shop\wt`
	srv := &Server{
		Worktrees: &stubWorktrees{},
		Folders:   &stubFolders{result: folderpick.Result{Path: path}},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var got pickFolderResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.Path == nil || *got.Path != path {
		t.Fatalf("got=%+v", got)
	}
}

func TestPickFolderCancelled(t *testing.T) {
	t.Parallel()
	srv := &Server{
		Worktrees: &stubWorktrees{},
		Folders:   &stubFolders{result: folderpick.Result{Cancelled: true}},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rec.Code, rec.Body.String())
	}
	var got pickFolderResponse
	if err := json.NewDecoder(rec.Body).Decode(&got); err != nil {
		t.Fatal(err)
	}
	if got.Path != nil {
		t.Fatalf("path=%v want null", got.Path)
	}
}

func TestPickFolderBusy(t *testing.T) {
	t.Parallel()
	srv := &Server{
		Worktrees: &stubWorktrees{},
		Folders:   &stubFolders{err: folderpick.ErrBusy},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusConflict {
		t.Fatalf("status=%d want 409 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, folderpick.CodeBusy)
}

func TestPickFolderCanceled(t *testing.T) {
	t.Parallel()
	srv := &Server{
		Worktrees: &stubWorktrees{},
		Folders:   &stubFolders{err: context.Canceled},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusGatewayTimeout {
		t.Fatalf("status=%d want 504 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, "folder_pick_canceled")
}

func TestPickFolderFailed(t *testing.T) {
	t.Parallel()
	srv := &Server{
		Worktrees: &stubWorktrees{},
		Folders:   &stubFolders{err: errors.New("os error")},
	}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status=%d want 500 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, "folder_pick_failed")
}

func TestPickFolderNotConfigured(t *testing.T) {
	t.Parallel()
	srv := &Server{Worktrees: &stubWorktrees{}}
	rec := httptest.NewRecorder()
	req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/pick-folder", nil)
	req.Header.Set("Origin", "http://127.0.0.1:5173")
	srv.Handler().ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("status=%d want 500 body=%s", rec.Code, rec.Body.String())
	}
	assertErrorCode(t, rec, "internal")
}

func assertErrorCode(t *testing.T, rec *httptest.ResponseRecorder, want string) {
	t.Helper()
	var body errorBody
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v body=%s", err, rec.Body.String())
	}
	if body.Error.Code != want {
		t.Fatalf("code=%q want %q message=%q", body.Error.Code, want, body.Error.Message)
	}
	if body.Error.Message == "" {
		t.Fatal("empty message")
	}
}
