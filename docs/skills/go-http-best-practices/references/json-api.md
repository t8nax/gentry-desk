# JSON API

## Encoding

```go
func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json; charset=utf-8")
    w.WriteHeader(status)
    enc := json.NewEncoder(w)
    enc.SetEscapeHTML(false)
    _ = enc.Encode(v)
}
```

- Всегда `charset=utf-8`.
- `SetEscapeHTML(false)` — для API (не HTML).
- Пиши header status **до** encode; один write path.

## Decoding

```go
dec := json.NewDecoder(r.Body)
dec.DisallowUnknownFields()
if err := dec.Decode(&req); err != nil { /* 400 input_invalid */ }
```

- `DisallowUnknownFields` — обязателен для входных body.
- После decode: `TrimSpace` на строковых полях; пустые → `input_invalid`.
- Ограничивай размер body при появлении крупных payload (`http.MaxBytesReader`).

## Error envelope

Единый формат (не меняй без миграции фронта):

```json
{
  "error": {
    "code": "input_invalid",
    "message": "Укажите project и path.",
    "hint": "optional"
  }
}
```

- `code` — стабильный машинный ключ (фронт может ветвиться).
- `message` — текст оператору (русский).
- `hint` — указатель/подсказка; omitempty.

## DTO placement

- Request/response types живут в **доменном** пакете (`worktrees.AddRequest`), если это контракт экрана.
- Чисто транспортные обёртки (`errorBody`) — в `api`.
- JSON-теги = публичный контракт; переименование = breaking change для Vue клиента.

## Null vs omit

| Need | Type |
| --- | --- |
| Field always present | value (`string`, `bool`) |
| Explicit null to UI | pointer (`*string`, `*int`) |
| Absent when empty | `omitempty` on pointer or slice |

Сохраняй семантику как в `worktrees.Task` (`Percent *int`, `DetailsUnavailable bool`).
