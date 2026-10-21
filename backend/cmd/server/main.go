package main

import (
	"context"
	"flag"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/t8nax/gentry-desk/backend/internal/api"
	"github.com/t8nax/gentry-desk/backend/internal/cli"
	"github.com/t8nax/gentry-desk/backend/internal/worktrees"
)

func main() {
	addr := flag.String("addr", "127.0.0.1:8787", "loopback listen address")
	gentryPath := flag.String("gentry", envOr("GENTRY", ""), "path to gentry executable (default: PATH)")
	flag.Parse()

	runner := &cli.Runner{Path: *gentryPath}
	svc := &worktrees.Service{CLI: runner}
	srv := &api.Server{
		Worktrees: svc,
		CLI:       runner,
		Addr:      *addr,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	if err := srv.ListenAndServe(ctx); err != nil {
		log.Fatal(err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
