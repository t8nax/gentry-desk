---
name: backend-modules
description: >-
  Project architecture for the Go backend under backend/: cmd entrypoints,
  internal domain packages, api HTTP surface, dependency injection via structs,
  test seams. Use when creating or restructuring packages in backend/cmd or
  backend/internal, adding HTTP handlers, domain services, or CLI adapters.
  Load first for backend work, then apply go-best-practices, go-http-best-practices,
  and go-testing-best-practices as needed.
---

# Backend Modules

Единый канон структуры Go-бэкенда панели.

Эталоны:
- entrypoint: `backend/cmd/server/main.go`
- HTTP: `backend/internal/api/`
- домен: `backend/internal/worktrees/`
- адаптер CLI: `backend/internal/cli/`

## Когда читать

- Новый или расширяемый пакет в `backend/cmd/` или `backend/internal/`
- Добавление HTTP-эндпоинта, доменного сервиса, адаптера внешней команды/API
- Рефакторинг границ пакетов (api ↔ domain ↔ infrastructure)

Сначала этот скилл (каркас), затем связанные — по таблице ниже.

## Связанные скиллы (обязательно по необходимости)

| Что делаешь | Читай |
| --- | --- |
| Язык, пакеты, ошибки, интерфейсы, concurrency | [go-best-practices](../go-best-practices/SKILL.md) |
| Handlers, middleware, JSON API, CORS/CSRF | [go-http-best-practices](../go-http-best-practices/SKILL.md) |
| Тесты, doubles, table-driven | [go-testing-best-practices](../go-testing-best-practices/SKILL.md) |

Типичный поток: **backend-modules** → **go-best-practices** → при HTTP **go-http-best-practices** → при тестах **go-testing-best-practices**.

## Корни модулей

| Корень | Назначение | Пример |
| --- | --- | --- |
| `backend/cmd/<bin>/` | Тонкий `main`: флаги, wiring, сигналы | `cmd/server/` |
| `backend/internal/<domain>/` | Доменная логика, DTO экрана, use-case | `internal/worktrees/` |
| `backend/internal/api/` | HTTP-поверхность: mux, middleware, сериализация | `internal/api/` |
| `backend/internal/<adapter>/` | Внешний мир (CLI, FS, remote) | `internal/cli/` |

Правила:
- `cmd` только собирает зависимости и запускает процесс — **без** бизнес-логики.
- Публичный API модуля — только то, что нужно соседним пакетам; остальное неэкспортировано.
- Не клади HTTP-парсинг в домен и доменную сборку экрана в `api`.
- Не создавай пустые пакеты «на будущее».

## Состав доменного пакета

```
backend/internal/<domain>/
├── service.go          # Service + публичные методы (Load, Add, …)
├── types.go            # (если нужно) DTO / request / result — или в service.go
├── <concern>.go        # (если нужно) узкая логика (join, percent, …)
├── service_test.go     # тесты пакета
└── <concern>_test.go
```

Обязательный каркас (как у `worktrees`):

1. **Service** (или аналог) со структурой зависимостей через поля
2. Публичные методы принимают `context.Context` первым аргументом
3. Типы ответа/запроса рядом с сервисом (JSON-теги для API-контракта)
4. Тесты в том же пакете (`package worktrees`), с подменой зависимостей

### Что типично по слою

| Часть | cmd | api | domain | adapter (cli) |
| --- | --- | --- | --- | --- |
| `main` / флаги / signal | да | нет | нет | нет |
| `http.Handler` / mux | нет | да | нет | нет |
| Сборка экрана / use-case | нет | тонкий вызов | да | нет |
| `exec` / сеть / FS | нет | нет | нет | да |
| Маппинг ошибок → HTTP | нет | да | нет | типизированные ошибки |

## Именование

| Артефакт | Правило | Примеры |
| --- | --- | --- |
| Модуль Go | `github.com/t8nax/gentry-desk/backend` | `go.mod` |
| Пакет | короткое lowercase имя домена | `worktrees`, `cli`, `api` |
| Файл | snake по смыслу, не `utils.go` | `service.go`, `progress_test.go` |
| Тип сервиса | `Service` / роль | `worktrees.Service`, `cli.Runner` |
| HTTP-сервер | `Server` + `handleX` | `api.Server`, `handleList` |
| Ошибка адаптера | экспортируемый тип + коды | `cli.Error`, `cli.CodeTimeout` |

Не заводи пакеты `common`, `util`, `helpers` — выноси конкретику в домен или маленький неэкспортированный файл.

## Зависимости и wiring

- Инъекция через **поля структур** (не global state, не `init` с побочными эффектами).
- Тестовые швы — опциональные поля-функции (`LookPath`, `Command`), как в `cli.Runner`.
- В `main` создай граф один раз и передай вниз:

```go
runner := &cli.Runner{Path: *gentryPath}
svc := &worktrees.Service{CLI: runner}
srv := &api.Server{Worktrees: svc, CLI: runner, Addr: *addr}
```

- Домен зависит от адаптера через конкретный тип **или** узкий интерфейс, объявленный у потребителя (см. go-best-practices → interfaces).
- Циклы импорта запрещены: `api` → `worktrees` → `cli`; не наоборот.

## Контракт ошибок

- Адаптер возвращает **типизированные** ошибки с машинным `Code` и текстом для оператора.
- `api` мапит код → HTTP status (`errors.As`); домен пробрасывает ошибку без HTTP-знаний.
- Сообщения UI — на русском (как сейчас в панели); диагностику (`Stderr`) не отдавай клиенту.

## Context и жизненный цикл

- Все I/O и use-case методы: `ctx context.Context` первым аргументом.
- `main` — `signal.NotifyContext`; сервер гасится через `Shutdown` по отмене ctx.
- Не храни `context.Context` в структурах долгоживущих объектов.

## Чеклист нового домена

- [ ] Пакет в `internal/<domain>/`, без утечки в `cmd`
- [ ] Service с явными зависимостями-полями
- [ ] Методы с `context.Context`
- [ ] DTO с JSON-тегами только на границе API
- [ ] Handlers в `api` тонкие: decode → call → encode/error
- [ ] Тесты с подменой адаптера / fake CLI
- [ ] Нет нового пакета `util`/`common`

## Дополнительно

- Язык и идиомы: [go-best-practices](../go-best-practices/SKILL.md)
- HTTP: [go-http-best-practices](../go-http-best-practices/SKILL.md)
- Тесты: [go-testing-best-practices](../go-testing-best-practices/SKILL.md)
