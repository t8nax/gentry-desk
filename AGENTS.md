# Agent guidance

Стек фронтенда панели: **Vue 3** + **Vue Router** + **Pinia** + **Tailwind CSS**.

При любой работе с `.vue`, роутингом, сторами Pinia, composables, Tailwind-классами, SCSS или кастомными CSS-классами сначала прочитай соответствующий скилл из `docs/skills/` и следуй ему.

**Модули:** при создании или изменении модуля во `views/`, `layouts/` или `components/` сначала читай `frontend-modules` (единая структура; эталоны: `worktrees`, `LayoutHeader`, `AppButton`), затем скиллы стека по таблице.

**Стили:** по умолчанию используй Tailwind. Пиши свой SCSS только если нужный стиль нельзя выразить утилитами Tailwind; в этом случае строго соблюдай БЭМ (`bem-conventions`) и правила Sass (`scss-best-practices`).

**Валидация форм:** для полей ввода и submit-проверок используй `useFormValidation` из `frontend/src/composables/useFormValidation.ts`. Не заводи локальный `failure`/`error` shallowRef и не дублируй UI ошибок вручную — детали и эталон в `frontend-modules` (раздел «Валидация форм»).

## Скиллы

| Скилл | Когда читать | Путь |
| --- | --- | --- |
| **frontend-modules** | Архитектура модуля в `views/` / `layouts/` / `components/`: папка домена, naming, routes/store/dialogs/helper | [docs/skills/frontend-modules/SKILL.md](docs/skills/frontend-modules/SKILL.md) |
| **vue-best-practices** | Vue 3, Composition API, SFC, composables, реактивность | [docs/skills/vue-best-practices/SKILL.md](docs/skills/vue-best-practices/SKILL.md) |
| **vue-router-best-practices** | Vue Router 4: guards, params, lifecycle маршрутов | [docs/skills/vue-router-best-practices/SKILL.md](docs/skills/vue-router-best-practices/SKILL.md) |
| **vue-pinia-best-practices** | Pinia: setup stores, реактивность, паттерны состояния | [docs/skills/vue-pinia-best-practices/SKILL.md](docs/skills/vue-pinia-best-practices/SKILL.md) |
| **tailwind-best-practices** | Tailwind CSS v3.4+ / v4: утилиты, responsive, тема, миграция | [docs/skills/tailwind-best-practices/SKILL.md](docs/skills/tailwind-best-practices/SKILL.md) |
| **scss-best-practices** | SCSS/Sass: архитектура, `@use`, переменные, миксины, вложенность | [docs/skills/scss-best-practices/SKILL.md](docs/skills/scss-best-practices/SKILL.md) |
| **bem-conventions** | Именование классов по БЭМ в кастомном SCSS/CSS (обязательно, если не Tailwind) | [docs/skills/bem-conventions/SKILL.md](docs/skills/bem-conventions/SKILL.md) |

Для типичной фичи на стеке: начни с `frontend-modules` (каркас модуля), затем `vue-best-practices`; при роутинге добавь `vue-router-best-practices`, при сторе модуля — `vue-pinia-best-practices`, при вёрстке — `tailwind-best-practices`. Если нужен кастомный SCSS — `scss-best-practices` + `bem-conventions`.

## Источники

- Архитектура модулей: проектное правило в `frontend-modules` (эталоны: `views/worktrees`, `layouts/LayoutHeader`, `components/AppButton`)
- Vue / Router / Pinia: [vuejs-ai/skills](https://github.com/vuejs-ai/skills) (MIT)
- Tailwind: [asyrafhussin/agent-skills](https://github.com/asyrafhussin/agent-skills) → `tailwind-best-practices` (MIT)
- SCSS: [Mindrally/skills](https://github.com/Mindrally/skills) → `scss-best-practices` (Apache-2.0)
- BEM: проектное правило в `bem-conventions` (канон БЭМ: block / `__` element / `--` modifier)

Канонические копии лежат в `docs/skills/`. Читай `SKILL.md` и нужные `reference`/`references` по ссылкам из таблицы выше.
