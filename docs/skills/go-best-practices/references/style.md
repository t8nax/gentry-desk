# Style & naming

Aligned with [Effective Go](https://go.dev/doc/effective_go) and Google Go Style — коротко для этого репо.

## Naming

| Kind | Convention | Example |
| --- | --- | --- |
| Package | lowercase, no underscore | `worktrees` |
| Exported | MixedCaps | `Service`, `AddRequest` |
| Unexported | mixedCaps | `joinTask`, `writeJSON` |
| Getters | no `Get` prefix | `path()`, not `GetPath()` |
| Interfaces | noun / `-er` when it fits | `Reader`, `gentryCLI` |
| Tests | `TestXxx`, `t.Run("case", …)` | `TestLoadJoinsTasks…` |
| Const codes | `Code` + name | `CodeTimeout` |

- Акронмы: `ID`, `HTTP`, `CLI` в экспорте (`Task.ID`, не `Task.Id` в **нашем** JSON — но контракт Gentry может диктовать `Id`; уважай внешний schema).
- Длина имени ∝ дистанции: чем дальше использование, тем полнее имя.

## Comments

```go
// Package worktrees assembles the «Рабочие копии» screen from Gentry CLI lists.
package worktrees

// Load builds the screen: project list, then per project worktree list + task list.
func (s *Service) Load(ctx context.Context) (*Screen, error) {
```

- Каждый экспортируемый символ — комментарий, начинающийся с имени символа.
- Не комментируй очевидное (`// increment i`).
- «Почему» важнее «что».

## Formatting & tooling

- `gofmt` / `goimports` — обязательно.
- `go vet ./...` — чисто.
- Модуль: держи `go.mod` / `go.sum` согласованными; не коммить replace без нужды.

## Clarity patterns

- Early return вместо глубокой вложенности.
- Table-driven там, где много веток одного типа (см. testing skill).
- Магические строки — в `const` рядом с использованием (`Occupancy: "busy"`).
- Pointer fields в JSON DTO — только для optional/`null` семантики (`*string`, `*bool`).

## Logging

- В `cmd` / startup: `log.Printf` достаточно.
- Не логируй и одновременно не возвращай одну и ту же ошибку на каждом слое (двойной шум).
- Секреты и полные пути окружения оператора — не в лог без нужды.
