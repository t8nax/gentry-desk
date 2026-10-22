// Package folderpick opens a native OS directory dialog for the local desk.
package folderpick

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/ncruces/zenity"
)

// Machine codes for folderpick failures (HTTP maps them in api).
const CodeBusy = "folder_pick_busy"

// Error is a typed folderpick failure with a machine Code for the desk API.
type Error struct {
	Code    string
	Message string
}

func (e *Error) Error() string {
	if e == nil {
		return ""
	}
	return e.Message
}

// ErrBusy is returned when another folder dialog is already open.
var ErrBusy = &Error{Code: CodeBusy, Message: "folder pick already in progress"}

// Result is the outcome of a directory dialog.
type Result struct {
	// Path is the selected absolute path; empty when Cancelled.
	Path string
	// Cancelled is true when the operator closed the dialog without a choice.
	Cancelled bool
}

// Picker opens at most one native directory dialog at a time.
type Picker struct {
	// Select opens the dialog. Nil uses the OS default (zenity).
	Select func(ctx context.Context) (Result, error)

	mu sync.Mutex
}

// Pick shows a directory chooser and returns the selected path.
func (p *Picker) Pick(ctx context.Context) (Result, error) {
	if !p.mu.TryLock() {
		return Result{}, ErrBusy
	}
	defer p.mu.Unlock()

	selectFn := p.Select
	if selectFn == nil {
		selectFn = defaultSelect
	}
	return selectFn(ctx)
}

func defaultSelect(ctx context.Context) (Result, error) {
	path, err := zenity.SelectFile(
		zenity.Context(ctx),
		zenity.Title("Выберите каталог рабочей копии"),
		zenity.Directory(),
	)
	if err != nil {
		if errors.Is(err, zenity.ErrCanceled) {
			return Result{Cancelled: true}, nil
		}
		if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
			return Result{}, err
		}
		return Result{}, fmt.Errorf("select folder: %w", err)
	}
	return Result{Path: path}, nil
}
