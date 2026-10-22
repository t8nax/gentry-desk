# Context & concurrency

## Context

```go
func (s *Service) Load(ctx context.Context) (*Screen, error) {
    if err := s.CLI.Run(ctx, &out, "project", "list"); err != nil {
        return nil, err
    }
    // …
}
```

- Первый аргумент: `ctx context.Context`.
- Не храни `ctx` в полях `Service` / `Server` / `Runner`.
- Для сервера: `BaseContext` → request ctx; shutdown по parent cancel (см. `ListenAndServe`).
- Если у входящего ctx нет deadline — адаптер может поставить свой (`cli.DefaultTimeout`), но **не** игнорируй уже заданный.

## Goroutines

Запускай горутину только если:

1. Есть стратегия остановки (ctx, `Shutdown`, wait на `errCh`).
2. Ошибки не теряются (канал / `errgroup` / явный log+metric на фоне).

Паттерн сервера в репо:

```go
errCh := make(chan error, 1)
go func() { errCh <- srv.Serve(ln) }()
select {
case <-ctx.Done():
    // Shutdown with timeout
case err := <-errCh:
    // …
}
```

- Буфер `1` на error-канал — чтобы горутина не зависла при раннем return.
- Не используй `go` для «ускорения» без измерения и без отмены.

## Sync & ownership

- Предпочитай **одну горутину-владельца** данных вместо широких mutex-сеток.
- `sync.Mutex` — короткие критические секции; не вызывай I/O под lock.
- `sync.Once` — для одноразовой инициализации.
- Каналы — для сигнализации и ownership transfer, не как «очередь на всё».

## Cancellation in exec / I/O

- `exec.CommandContext` — обязательно (уже в `cli.Runner`).
- В циклах: `select` на `ctx.Done()` или передача ctx в API, которое его уважает.
- Мапь `context.Canceled` / `DeadlineExceeded` в доменные коды ошибок.

## Race detector

Локально и в CI:

```bash
go test -race ./...
```

Считай data race блокером мержа.
