---
name: go-http-best-practices
description: >-
  Senior-level Go HTTP API practices for Gentry Desk: net/http ServeMux patterns,
  thin handlers, JSON encode/decode, middleware, CORS/CSRF for loopback, graceful
  shutdown, error-to-status mapping. Use when editing backend/internal/api,
  adding endpoints, or changing request/response contracts. Load after
  backend-modules and go-best-practices.
---

# Go HTTP Best Practices

Канон HTTP-слоя панели: stdlib `net/http` (без фреймворков), тонкие handlers, JSON-контракт.

Эталон: `backend/internal/api/server.go`.

## Core Principles

- **Handlers тонкие:** decode → validate → service → encode / map error.
- **Домен не знает HTTP:** статусы и заголовки только в `api`.
- **Безопасность локального API:** loopback listen, origin checks на mutating methods.
- **Явный JSON-контракт:** `DisallowUnknownFields`, стабильные теги, ошибки единого вида.

## 1) Перед кодом (required)

- Границы пакетов: [backend-modules](../backend-modules/SKILL.md)
- Ошибки/context: [go-best-practices](../go-best-practices/SKILL.md)

### 1.1 Must-read references (required)

- [handlers](references/handlers.md)
- [json-api](references/json-api.md)
- [middleware](references/middleware.md)

## 2) Routing

Используй Go 1.22+ patterns на `ServeMux`:

```go
mux.HandleFunc("GET /api/worktrees", s.handleList)
mux.HandleFunc("POST /api/worktrees", s.handleAdd)
```

- Метод в паттерне — не отдельный `if r.Method != …` в каждом handler (кроме middleware).
- Группируй middleware в `withMiddleware` вокруг корневого mux.
- Health: простой `GET /api/health`.

## 3) Handler checklist

Каждый новый endpoint:

- [ ] Регистрация с методом в pattern
- [ ] Read-only / mutating политика соблюдена (`ReadOnly`, CSRF origin)
- [ ] Decode через `json.Decoder` + `DisallowUnknownFields` (для body)
- [ ] Trim/validate входных строк до вызова сервиса
- [ ] `r.Context()` в сервис
- [ ] Успех → `writeJSON`; ошибка → `writeCLIError` / `writeError`
- [ ] Нет бизнес-логики в handler

## 4) Server lifecycle

- Слушать **только loopback** (проверка IP в `ListenAndServe`).
- `ReadHeaderTimeout` задан.
- `BaseContext` связан с process ctx.
- Cancel → `Shutdown` с таймаутом.

## 5) Связанные скиллы

| Тема | Скилл |
| --- | --- |
| Новый домен / wiring | [backend-modules](../backend-modules/SKILL.md) |
| Типизированные ошибки | [go-best-practices](../go-best-practices/SKILL.md) → errors |
| Тесты handlers / API | [go-testing-best-practices](../go-testing-best-practices/SKILL.md) |

## Anti-patterns

- Gin/Echo/Fiber без явного решения команды (здесь stdlib)
- `http.Error` с произвольным текстом вместо `{error:{code,message}}`
- Логика join/percent в handler
- Listen на `0.0.0.0` / не-loopback
- Игнор `Origin` на POST из браузера
- Глобальный mux / global `Server` var
