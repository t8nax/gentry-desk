# Middleware & security (local desk)

Панель слушает **loopback** и дергает API из Vite origin. Middleware отражает это.

## Stack order

```go
return s.withMiddleware(mux)
```

Внутри `withMiddleware`:

1. CORS headers если `Origin` в allow-list
2. `OPTIONS` → 204
3. Для non-GET/HEAD → `checkMutatingOrigin`
4. `next.ServeHTTP`

Не раздувай цепочку без нужды (нет auth-token слоя, пока продукт локальный).

## CORS allow-list

Default:

- `http://127.0.0.1:5173`
- `http://localhost:5173`

Переопределение — поле `AllowedOrigins`. Reflect только известный origin (не `*`).

## CSRF-ish for mutating requests

Браузерные POST обязаны иметь разрешённый `Origin` или `Referer`.  
Non-browser (`curl`, тесты): нет Origin/Referer → смотри `Sec-Fetch-Site` (`""`, `none`, `same-origin`, `same-site` OK).

Отказ → `403` + `csrf_rejected`.

## Loopback bind

```go
if ip := net.ParseIP(host); ip == nil || !ip.IsLoopback() {
    return errors.New("server must listen on a loopback address")
}
```

Не ослабляй эту проверку «для удобства» — desk API не предназначен для сети.

## Read-only mode

При `contract_unsupported`: `ReadOnly = true`, GET работают, POST → `409` + hint.  
Проверка — в mutating handlers, не в домене.

## Timeouts

- `ReadHeaderTimeout` на `http.Server` (сейчас 5s)
- Shutdown timeout (сейчас 5s)
- CLI timeout отдельно в `cli.Runner`

## Headers to set on JSON responses

Через `writeJSON` / `writeError` — `Content-Type`.  
Не забывай `Vary: Origin` когда отдаёшь `Access-Control-Allow-Origin`.
