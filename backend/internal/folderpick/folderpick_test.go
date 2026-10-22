package folderpick

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"
)

func TestPickReturnsSelectedPath(t *testing.T) {
	t.Parallel()
	p := &Picker{
		Select: func(context.Context) (Result, error) {
			return Result{Path: `C:\shop\wt`}, nil
		},
	}
	got, err := p.Pick(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got.Cancelled || got.Path != `C:\shop\wt` {
		t.Fatalf("got=%+v", got)
	}
}

func TestPickCancelled(t *testing.T) {
	t.Parallel()
	p := &Picker{
		Select: func(context.Context) (Result, error) {
			return Result{Cancelled: true}, nil
		},
	}
	got, err := p.Pick(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if !got.Cancelled || got.Path != "" {
		t.Fatalf("got=%+v", got)
	}
}

func TestPickBusy(t *testing.T) {
	t.Parallel()
	started := make(chan struct{})
	release := make(chan struct{})
	p := &Picker{
		Select: func(context.Context) (Result, error) {
			close(started)
			<-release
			return Result{Path: `C:\a`}, nil
		},
	}

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		_, _ = p.Pick(context.Background())
	}()

	select {
	case <-started:
	case <-time.After(2 * time.Second):
		t.Fatal("first pick did not start")
	}

	_, err := p.Pick(context.Background())
	if !errors.Is(err, ErrBusy) {
		t.Fatalf("err=%v want ErrBusy", err)
	}

	close(release)
	wg.Wait()
}

func TestPickPropagatesSelectError(t *testing.T) {
	t.Parallel()
	want := errors.New("boom")
	p := &Picker{
		Select: func(context.Context) (Result, error) {
			return Result{}, want
		},
	}
	_, err := p.Pick(context.Background())
	if !errors.Is(err, want) {
		t.Fatalf("err=%v", err)
	}
}
