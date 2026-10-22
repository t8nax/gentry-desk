---
name: go-testing-best-practices
description: >-
  Senior-level Go testing for Gentry Desk backend: table-driven tests, t.Parallel,
  fake CLI/exec seams, httptest, race detector, focused assertions. Use when
  writing or changing *_test.go under backend/, adding test doubles, or verifying
  domain/API behavior. Load with go-best-practices; for HTTP handlers also load
  go-http-best-practices.
---

# Go Testing Best Practices

Тесты — часть контракта пакета. Стиль репо: stdlib `testing`, fake process для CLI, parallel где безопасно.

Эталоны: `backend/internal/worktrees/service_test.go`, `backend/internal/cli/cli_test.go`.

## Core Principles

- **Поведение, не покрытие ради покрытия:** каждый тест — регрессия осмысленного сценария.
- **Швы вместо мок-фреймворков:** func fields, fake binaries, `httptest`.
- **Table-driven** для вариаций одного поведения.
- **Fast & hermetic:** `t.TempDir()`, никаких реальных `gentry` в unit-тестах.

## 1) Перед тестами (required)

- Понятна граница пакета: [backend-modules](../backend-modules/SKILL.md)
- Швы зависимостей: [go-best-practices](../go-best-practices/SKILL.md) → interfaces / packages

### 1.1 Must-read references (required)

- [table-driven](references/table-driven.md)
- [doubles](references/doubles.md)

## 2) Defaults for this repo

```go
func TestLoadJoinsTasksAndMissingDetails(t *testing.T) {
    t.Parallel()
    // arrange fake gentry script in t.TempDir()
    svc := &Service{CLI: &cli.Runner{Path: script, Timeout: 10 * time.Second}}
    screen, err := svc.Load(context.Background())
    if err != nil {
        t.Fatal(err)
    }
    // assert with focused Fatals
}
```

- Пакет тестов = тот же `package worktrees` (white-box), пока не тестируешь только экспорт.
- `t.Parallel()` на независимых тестах; не параллель при shared process-global state.
- `t.Fatal` / `t.Fatalf` на setup и инвариантах; сравни конкретно поля, не весь struct dump без нужды.

## 3) What to test by layer

| Layer | Focus |
| --- | --- |
| `cli` | exit→error code, timeout, invalid JSON, env stripping |
| `worktrees` | join task/worktree, percent, missing details, Add mapping |
| `api` | status codes, JSON envelope, CSRF rejection, validation 400 |
| `cmd` | обычно без unit-тестов (wiring) |

## 4) Commands

```bash
cd backend
go test ./...
go test -race ./...
go test -count=1 ./internal/worktrees/
```

- `-race` на код с горутинами / shared state.
- `-count=1` отключает кэш при отладке flaky.

## 5) Checklist нового теста

- [ ] Имя описывает поведение: `TestLoadJoinsTasksAndMissingDetails`
- [ ] Нет сети и реального `gentry` на PATH
- [ ] Использует ctx (хотя бы `context.Background()` / `WithTimeout`)
- [ ] При ошибке assertion — достаточный контекст в сообщении
- [ ] Не дублирует уже покрытый сценарий 1:1
- [ ] При table-driven — `t.Run(name, …)`

## Anti-patterns

- Testify/gomock без решения команды (здесь stdlib + fakes)
- Sleep для синхронизации вместо каналов/ctx
- Тест, завязанный на wall-clock без ускоряемого шва
- Snapshot всего JSON без проверки ключевых полей
- `t.Skip` «потом починим» в main branch без issue
