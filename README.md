# Gentry Desk

Панель для работы с проектами и рабочими копиями [Gentry](https://github.com/t8nax/gentry): Vue 3 + Pinia на фронте, HTTP API на Go на бэке.

## Требования

- **Node.js** 20+ и npm
- **Go** 1.22+ (см. `backend/go.mod`)
- CLI **gentry** в `PATH` (или путь через `-gentry` / `GENTRY`) — нужен бэкенду для списка worktrees

## Локальная разработка

Фронт и бэк запускаются в **двух терминалах**. Vite проксирует `/api` на бэкенд `127.0.0.1:8787`.

### Backend

```bash
cd backend
go run ./cmd/server
```

По умолчанию слушает `http://127.0.0.1:8787`.

Опции:

```bash
go run ./cmd/server -addr 127.0.0.1:8787
go run ./cmd/server -gentry /path/to/gentry
# или
GENTRY=/path/to/gentry go run ./cmd/server
```

Проверка: `GET http://127.0.0.1:8787/api/health`

Тесты:

```bash
cd backend
go test ./...
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Откроется Vite на `http://127.0.0.1:5173` (порт задан в `frontend/vite.config.ts`).

Другие скрипты:

| Команда           | Назначение                          |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Dev-сервер с HMR и proxy `/api`     |
| `npm run build`   | Typecheck (`vue-tsc`) + production build |
| `npm run preview` | Превью собранного `dist/`           |

## Демо-стенд Gentry (опционально)

Чтобы в панели были тестовые проекты и задачи:

```bash
bash scripts/stand.sh
# затем, как подскажет скрипт:
export GENTRY_HOME=<папка стенда>/home
```

По умолчанию стенд создаётся в `~/gentry-stand`.

## Структура

```
frontend/   # Vue 3 + Vue Router + Pinia + Tailwind + Vite
backend/    # Go HTTP API (cmd/server, internal/api, worktrees, cli)
docs/       # скиллы и соглашения для агентов
scripts/    # вспомогательные скрипты (демо-стенд)
```

Правила для агентов и скиллы стека: [AGENTS.md](AGENTS.md).
