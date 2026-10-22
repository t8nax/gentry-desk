# Test doubles

## Preferred seams in this repo

### 1) Fake executable (CLI)

Как в `worktrees` / `cli` тестах: скрипт в `t.TempDir()`, `Runner{Path: script}`.

- Мапа argv → `{exit, stdout, stderr}`
- Кросс-платформа: учти Windows (`runtime.GOOS`, `.cmd` / `.bat` / go-built helper)
- Всегда `Timeout` на Runner в тестах

Это **integration-style unit**: реальный `exec`, контролируемый бинарь.

### 2) Function fields

```go
type Runner struct {
    LookPath func(file string) (string, error)
    Command  func(ctx context.Context, name string, arg ...string) *exec.Cmd
}
```

Подмена в тесте без интерфейса — senior-паттерн для одного адаптера.

### 3) Small consumer interfaces

Если fake executable тяжёлый — объяви 1–2 метода у потребителя и передай stub.

```go
type stubCLI struct{}

func (stubCLI) Run(ctx context.Context, dest any, args ...string) error {
    // marshal fixture into dest
    return nil
}
```

## HTTP

```go
req := httptest.NewRequestWithContext(ctx, http.MethodPost, "/api/worktrees", body)
rec := httptest.NewRecorder()
srv.Handler().ServeHTTP(rec, req)
```

- Собирай `Server` с тестовым `Worktrees` / CLI.
- Для CSRF: выставь `Origin` / `Referer` / `Sec-Fetch-Site` явно.

## What not to do

- Не мокай каждое поле JSON отдельно через тяжёлый framework.
- Не ходи в реальный PATH `gentry` в unit-тестах (flaky на машинах разработчиков).
- Не оставляй горутины после теста: отменяй ctx / Shutdown.
- Не используй `time.Sleep` для ожидания — дедлайн ctx или канал.

## Fixtures

- JSON фикстуры — рядом в тесте (строка) или `testdata/` для крупных.
- `testdata/` не трогай странными генераторами без нужды; золотые файлы — только если дифф осознан (`-update` флаг опционален).
