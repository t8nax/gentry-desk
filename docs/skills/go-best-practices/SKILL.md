---
name: go-best-practices
description: >-
  Senior-level Go language idioms for the Gentry Desk backend: packages, errors,
  interfaces, context, concurrency, naming, and code style. Use when writing or
  reviewing any .go file under backend/, refactoring packages, designing APIs
  between internal packages, or when the user asks for Go best practices.
  Load after backend-modules for structural work.
---

# Go Best Practices

Инструкции уровня Senior для кода в `backend/`. Следуй workflow по порядку, если пользователь не задал иной.

## Core Principles

- **Простота важнее абстракции:** меньше типов, меньше интерфейсов «на вырост».
- **Явные зависимости:** поля структур и аргументы, не globals.
- **Ошибки — часть контракта:** оборачивай с контекстом, различай типы через `errors.As`/`Is`.
- **Context везде на границе I/O:** отмена и дедлайны распространяются вниз.
- **Тестируемость без фреймворков:** швы через поля/интерфейсы у потребителя.

## 1) Подтверди границы пакетов (required)

- Сначала [backend-modules](../backend-modules/SKILL.md): `cmd` / `internal/<domain>` / `api` / adapters.
- Перед нетривиальной фичей нарисуй краткую карту пакетов: кто владеет данными, кто делает I/O, кто мапит в HTTP.

### 1.1 Must-read core references (required)

Перед реализацией любой Go-задачи прочитай и применяй:

- [packages](references/packages.md)
- [errors](references/errors.md)
- [interfaces](references/interfaces.md)
- [concurrency](references/concurrency.md)

Держи их в активном контексте всей задачи, не только при конкретной проблеме.

### 1.2 Style reference (as needed)

- Именование, комментарии, zero values: [style](references/style.md)

## 2) Фундамент на каждой задаче (required)

### Packages

- Must-read: [packages](references/packages.md)
- Один пакет = одна ответственность; имя — короткое существительное (`cli`, `worktrees`, `api`).
- Экспортируй минимум. Предпочитай `internal/`.
- Не создавай `utils`/`common`/`shared`.

### Errors

- Must-read: [errors](references/errors.md)
- Возвращай `error` последним значением; не паникуй в библиотечном коде.
- Оборачивай: `fmt.Errorf("load worktrees: %w", err)`.
- Для API/адаптера — типизированные ошибки с кодом (`cli.Error`), проверка через `errors.As`.
- Не глотай ошибки (`_ = …` только где осознанно безопасно, например `Shutdown` при выходе).

### Interfaces

- Must-read: [interfaces](references/interfaces.md)
- Объявляй интерфейс у **потребителя**, маленьким (1–3 метода).
- Возвращай конкретные типы; принимай интерфейсы.
- Не экспортируй интерфейс «на всякий случай», если есть один продюсер.

### Context & concurrency

- Must-read: [concurrency](references/concurrency.md)
- `ctx` — первый аргумент; не клади в структуры.
- Горутины только с понятным lifetime (отмена через ctx или `errgroup`).
- Никаких «fire-and-forget» без учёта shutdown.
- Защищай shared state (`sync` / каналы); предпочитай ownership одной горутины.

## 3) Чеклист перед сдачей кода

- [ ] Нет логики в `main` сверх wiring
- [ ] Зависимости инжектятся полями / аргументами
- [ ] Все I/O уважают `ctx`
- [ ] Ошибки обёрнуты и/или типизированы; HTTP-маппинг только в `api`
- [ ] Интерфейсы минимальны или их нет (конкретный тип достаточен)
- [ ] Нет data race на очевидных shared paths
- [ ] Экспорт и комментарии на `Doc` comments для экспортируемых символов
- [ ] Есть/обновлены тесты по [go-testing-best-practices](../go-testing-best-practices/SKILL.md)

## 4) Когда подключать соседние скиллы

| Ситуация | Скилл |
| --- | --- |
| Структура пакетов / новый домен | [backend-modules](../backend-modules/SKILL.md) |
| Handlers, JSON, middleware | [go-http-best-practices](../go-http-best-practices/SKILL.md) |
| Unit/integration tests | [go-testing-best-practices](../go-testing-best-practices/SKILL.md) |

## Anti-patterns (запрещено без явной причины)

- Глобальные `var client = …` с сетевым I/O
- `panic` / `log.Fatal` внутри библиотек `internal/`
- Игнорирование `ctx.Done()` в долгих циклах / `exec`
- «God» пакеты и catch-all `utils`
- Интерфейсы с 5+ методами «под моки»
- Хранение `context.Context` в долгоживущих struct-полях
- Комментарии, повторяющие имя функции
