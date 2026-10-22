# Packages

## Layout (this repo)

```
backend/
├── cmd/server/          # main only
├── internal/
│   ├── api/             # HTTP
│   ├── cli/             # Gentry process adapter
│   └── worktrees/       # domain screen assembly
├── go.mod
└── go.sum
```

- Module path: `github.com/t8nax/gentry-desk/backend`
- Import domain as `…/internal/worktrees`, never copy types across layers without need.

## Package rules

1. **Name** = what it provides (`worktrees`, not `worktrees_service`).
2. **Doc comment** on `package` line explaining role in one sentence (see existing packages).
3. **No cyclic imports.** Direction: `cmd` → `api` → domain → adapters.
4. **Prefer many small files over many packages** until a boundary is real (I/O vs pure logic, or separate deployable concern).
5. **`internal/` is mandatory** for app code that must not be imported by other modules.

## What belongs where

| Code | Package |
| --- | --- |
| Flag parsing, signal.NotifyContext, construct graph | `cmd/server` |
| ServeMux, middleware, JSON encode/decode, status map | `internal/api` |
| Join lists, compute percent, Add orchestration | `internal/worktrees` |
| exec.CommandContext, JSON from CLI, typed errors | `internal/cli` |

## File naming

- `service.go` — primary type + methods
- `*_test.go` — same package (white-box) unless you need to test only the public API from outside
- Avoid `helpers.go` / `util.go`; name by concern (`progress.go`)

## Zero-value & construction

- Design structs so zero value is useful **or** document required fields.
- Optional behavior via nil-able func fields (test seams), with defaults in unexported methods — pattern from `cli.Runner`.
