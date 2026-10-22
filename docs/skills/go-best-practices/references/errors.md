# Errors

## Basics

```go
if err != nil {
    return fmt.Errorf("list projects: %w", err)
}
```

- Always add **operation context** in the wrap message (what failed), not just `%w`.
- Return `nil` error only on success; do not return sentinel + data inconsistently.

## Typed errors (adapters / API)

Follow `cli.Error`: machine `Code`, operator `Message`, optional `Hint`, non-UI diagnostics unexported or tagged `json:"-"`.

```go
var ce *cli.Error
if errors.As(err, &ce) {
    // map ce.Code → behavior / HTTP status
}
```

- Sentinel vars (`var ErrNotFound = errors.New(...)`) — для простых случаев внутри пакета.
- Structured types — когда нужны поля (code, exit, hint).
- Реализуй `Error() string`; для unwrap — `Unwrap() error` при обёртке.

## HTTP boundary

- Domain/adapter **не** знают HTTP status.
- Только `api` переводит `cli.Error` → status (см. `writeCLIError`).
- Клиенту: `{ "error": { "code", "message", "hint?" } }`; не утекай `Stderr` / внутренние детали.

## Sentinel hygiene

```go
// Good: stable for errors.Is
var ErrCanceled = errors.New("canceled")

// Good: wrap with Is-compatible
return fmt.Errorf("run gentry: %w", context.Canceled)
```

Проверяй отмену: `errors.Is(err, context.Canceled)` / `DeadlineExceeded` и мапь в `CodeCanceled` / `CodeTimeout`.

## Anti-patterns

- `return err` из глубокого стека без wrap — теряется место сбоя
- `log.Printf` + `return nil` — ошибка проглочена
- Строковое сравнение `err.Error() == "..."`
- Один `error` string на все случаи без кода для API
