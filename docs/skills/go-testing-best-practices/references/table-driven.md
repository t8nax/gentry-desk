# Table-driven tests

## Pattern

```go
func TestPercent(t *testing.T) {
    t.Parallel()
    tests := []struct {
        name string
        in   TaskProgress
        want *int
    }{
        {name: "normal", in: TaskProgress{Passed: 3, TotalMax: 5}, want: intPtr(60)},
        {name: "clamp high", in: TaskProgress{Passed: 9, TotalMax: 5}, want: intPtr(100)},
        {name: "unknown", in: TaskProgress{TotalMax: 0}, want: nil},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got := percent(tt.in)
            // compare got vs tt.want
        })
    }
}
```

## Rules

- Имя кейса — **поведение**, не `case1`.
- Копируй `tt` в переменную цикла если запускаешь `t.Parallel` внутри `t.Run` (Go < 1.22 loop var); на Go 1.22+ loop var per-iteration — всё равно предпочитай ясность.
- Shared setup выноси до цикла; per-case setup — внутрь `t.Run`.
- Не мешай в одной таблице ортогональные оси (отдельно invalid input vs mapping success).

## Assertions

Stdlib-стиль репо:

```go
if got != want {
    t.Fatalf("percent: got %v want %v", got, want)
}
```

- Один `Fatal` — одна проверка инварианта; несколько проверок подряд допустимы, если читаются как сценарий.
- Для slice/map — `len` + ключевые элементы; `reflect.DeepEqual` — осознанно.
- Helpers: `t.Helper()` на assert-функциях.
