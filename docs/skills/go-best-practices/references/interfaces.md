# Interfaces

## Rules of thumb (Go proverb)

> The bigger the interface, the weaker the abstraction.

1. **Accept interfaces, return structs.**
2. Define interfaces **where they are used**, not where implemented.
3. Prefer **concrete** `*cli.Runner` in production code until a second implementation appears **or** a test needs a fake that isn't a function field.

## When to introduce an interface

| Introduce | Skip |
| --- | --- |
| Два+ реальных продюсера | Один `*Service` / `*Runner` |
| Тесту нужен stub без `exec` | Достаточно func-полей (`Command`, `LookPath`) |
| Потребителю нужны 1–2 метода | «Интерфейс на весь struct» |

Пример узкого интерфейса у потребителя:

```go
// in package worktrees (consumer)
type gentryCLI interface {
    Run(ctx context.Context, dest any, args ...string) error
}

type Service struct {
    CLI gentryCLI
}
```

В этом репозитории чаще используют **конкретный** `*cli.Runner` + швы на нём — это тоже senior-выбор (проще навигация). Не дублируй интерфейс «для красоты».

## Interface pollution

Плохо:

```go
type WorktreesService interface {
    Load(ctx context.Context) (*Screen, error)
    Add(ctx context.Context, req AddRequest) (*AddResult, error)
    // …ещё 8 методов
}
```

Хорошо: конкретный `*worktrees.Service` в `api.Server`; мокай CLI уровнем ниже.

## Composition

- Встраивай маленькие интерфейсы (`io.Reader`, `http.Handler`) вместо роллинга своих.
- Не встраивай интерфейсы в экспортируемые structs без нужды — раздувает API поверхности.
