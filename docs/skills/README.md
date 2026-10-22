# Project skills

Agent skills for:

- Frontend: Vue 3 + Vue Router + Pinia + Tailwind (plus SCSS/BEM when utilities are not enough)
- Backend: Go under `backend/` (stdlib `net/http`, `cmd` / `internal` layout)

See root [AGENTS.md](../../AGENTS.md) for when to load each skill.

## Contents

### Frontend

| Skill | Upstream |
| --- | --- |
| [frontend-modules](frontend-modules/SKILL.md) | Project rule (module layout for `views` / `layouts` / `components`) |
| [vue-best-practices](vue-best-practices/SKILL.md) | https://github.com/vuejs-ai/skills |
| [vue-router-best-practices](vue-router-best-practices/SKILL.md) | https://github.com/vuejs-ai/skills |
| [vue-pinia-best-practices](vue-pinia-best-practices/SKILL.md) | https://github.com/vuejs-ai/skills |
| [tailwind-best-practices](tailwind-best-practices/SKILL.md) | https://github.com/asyrafhussin/agent-skills |
| [scss-best-practices](scss-best-practices/SKILL.md) | https://github.com/Mindrally/skills (Apache-2.0) |
| [bem-conventions](bem-conventions/SKILL.md) | Project rule (strict BEM for custom SCSS) |

### Backend (Go)

| Skill | Upstream |
| --- | --- |
| [backend-modules](backend-modules/SKILL.md) | Project rule (`cmd` / `internal` layout; эталоны api, worktrees, cli) |
| [go-best-practices](go-best-practices/SKILL.md) | Project rule (packages, errors, interfaces, concurrency, style) |
| [go-http-best-practices](go-http-best-practices/SKILL.md) | Project rule (stdlib HTTP, JSON API, middleware, local security) |
| [go-testing-best-practices](go-testing-best-practices/SKILL.md) | Project rule (table-driven, fake CLI, httptest) |

Licenses: MIT for Vue/Router/Pinia/Tailwind upstreams; Apache-2.0 for SCSS skill (see `scss-best-practices/LICENSE`); `frontend-modules`, `bem-conventions`, and all `backend-modules` / `go-*` skills are project-authored.
