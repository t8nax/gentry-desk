# Handlers

## Shape

```go
func (s *Server) handleAdd(w http.ResponseWriter, r *http.Request) {
    if s.ReadOnly {
        writeError(w, http.StatusConflict, &cli.Error{ /* … */ })
        return
    }
    var req worktrees.AddRequest
    dec := json.NewDecoder(r.Body)
    dec.DisallowUnknownFields()
    if err := dec.Decode(&req); err != nil {
        writeError(w, http.StatusBadRequest, &cli.Error{
            Code: "input_invalid", Message: "…",
        })
        return
    }
    // trim + validate
    result, err := s.Worktrees.Add(r.Context(), req)
    if err != nil {
        writeCLIError(w, err)
        return
    }
    writeJSON(w, http.StatusOK, result)
}
```

## Responsibilities

| Handler does | Handler does not |
| --- | --- |
| Parse & validate input shape | Call `exec`, touch FS |
| Call one service method | Join multiple CLI lists |
| Map errors to HTTP | Invent new error codes silently |
| Set JSON content-type | Write ad-hoc HTML/text for API |

## Status mapping guidance

Держи таблицу рядом с `writeCLIError`:

| Condition | Status |
| --- | --- |
| Invalid JSON / missing fields | 400 |
| CSRF / bad origin | 403 |
| Contract unsupported / read-only mutate | 409 |
| Gentry operator failure (exit 1/2) | 422 |
| gentry not found | 503 |
| timeout / canceled | 504 |
| unknown | 500 with generic message |

Не отдавай `err.Error()` от неизвестных ошибок клиенту — только стабильное «Внутренняя ошибка панели.»

## Testing handlers

- `httptest.NewRecorder` + `http.NewRequestWithContext`
- Подмени `Worktrees` / CLI fake на уровне сервиса
- Проверяй status, `Content-Type`, JSON code поля ошибки
