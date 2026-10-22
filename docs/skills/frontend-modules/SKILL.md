---
name: frontend-modules
description: >-
  Project architecture for frontend modules under views, layouts, and components:
  folder-per-domain, domain naming for root SFC / routes / stores, optional nested
  components/dialogs/helper. Use when creating or restructuring any Vue module in
  frontend/src/views, frontend/src/layouts, or frontend/src/components. Load first
  for new modules, then apply vue / router / pinia / tailwind / scss / bem skills
  as needed.
---

# Frontend Modules

Единый канон структуры модуля панели для **`views/`**, **`layouts/`** и **`components/`**.

Эталоны:
- views: `frontend/src/views/worktrees/`
- layouts: `frontend/src/layouts/LayoutHeader/`
- components: `frontend/src/components/AppButton/`

## Когда читать

- Новый или расширяемый модуль в `views/`, `layouts/` или `components/`
- Добавление вложенных `components/`, `dialogs/`, `helper.ts`, роутов или стора внутри домена

Сначала этот скилл (каркас), затем связанные — по таблице ниже.

## Связанные скиллы (обязательно по необходимости)

| Что делаешь в модуле | Читай |
| --- | --- |
| `.vue`, Composition API, composables | [vue-best-practices](../vue-best-practices/SKILL.md) |
| Формы, поля, submit-валидация | раздел [Валидация форм](#валидация-форм) ниже + `frontend/src/composables/useFormValidation.ts` |
| Маршруты, guards, params | [vue-router-best-practices](../vue-router-best-practices/SKILL.md) |
| Pinia store модуля | [vue-pinia-best-practices](../vue-pinia-best-practices/SKILL.md) |
| Классы вёрстки | [tailwind-best-practices](../tailwind-best-practices/SKILL.md) |
| Кастомный SCSS (только если Tailwind не хватает) | [scss-best-practices](../scss-best-practices/SKILL.md) + [bem-conventions](../bem-conventions/SKILL.md) |

Типичный поток: **frontend-modules** → **vue-best-practices** → при роутинге **vue-router-best-practices** → при сторе **vue-pinia-best-practices** → **tailwind-best-practices** → при SCSS **scss** + **bem**.

## Корни модулей

| Корень | Назначение | Пример папки |
| --- | --- | --- |
| `frontend/src/views/<domain>/` | Страницы / разделы приложения | `worktrees/` |
| `frontend/src/layouts/<Domain>/` | Оболочка приложения (header, sidebar, …) | `LayoutHeader/` |
| `frontend/src/components/<Domain>/` | Переиспользуемые UI-блоки | `AppButton/`, `AppIcon/` |

Каждый модуль — **одна папка домена**. Не клади «голые» `.vue` прямо в `views/`, `layouts/` или `components/` без папки.

Где что живёт:
- UI раздела страницы → только в своём `views/<domain>/`
- UI оболочки → только в своём `layouts/<Domain>/`
- Общий UI → `components/<Domain>/` (не дублируй его внутри views/layouts)

## Состав модуля

Всё необязательное — **только если нужно**. Не создавай пустые папки «на будущее».

```
<root>/<DomainOrDomain>/
├── components/          # (если нужно) вложенный UI модуля
├── dialogs/             # (если нужно) модалки/диалоги
│   └── helper.ts        # (если нужно) логика только диалогов
├── helper.ts            # (если нужно) типы, provide/inject, утилиты модуля
├── <Domain>Root.vue     # корневой SFC модуля (см. именование)
├── <domain>Routes.ts    # (если нужно; обычно только views)
└── <domain>Store.ts     # (если нужно) Pinia-стор модуля
```

Обязательный каркас (как у worktrees):

1. **components** (если нужно)
2. **dialogs** (если нужно)
3. **helper.ts** (если нужно)
4. Название страницы/компонента с доменом модуля в корне названия (например, `WorktreesPage.vue`, `LayoutHeader.vue`, `AppButton.vue`)
5. Файл с роутами, если нужно. Так же с доменом модуля в корне названия (например, `worktreesRoutes.ts`)
6. Файл стора если нужно. Так же с доменом модуля в корне названия (`worktreesStore.ts`)

### Что типично по корню

| Часть | views | layouts | components |
| --- | --- | --- | --- |
| Корневой SFC | `<Domain>Page.vue` | `<Domain>.vue` (напр. `LayoutHeader.vue`) | `<Domain>.vue` (напр. `AppButton.vue`) |
| `components/` | часто | часто | редко (мелкие части того же домена) |
| `dialogs/` | часто | редко | редко |
| `helper.ts` | часто | часто | часто |
| `<domain>Routes.ts` | да, если есть маршруты | нет | нет |
| `<domain>Store.ts` | при доменном состоянии | при состоянии оболочки | редко |

## Именование

| Артефакт | Правило | Примеры |
| --- | --- | --- |
| Папка | домен: views — lowercase (`worktrees/`); layouts/components — PascalCase домена (`LayoutHeader/`, `AppButton/`) | |
| Корневой SFC | PascalCase, домен в корне имени | `WorktreesPage.vue`, `LayoutSidebar.vue`, `AppDialog.vue` |
| Вложенные компоненты | PascalCase, домен в корне имени | `WorktreesTable.vue`, `LayoutHeaderAgentBar.vue` |
| Диалоги | PascalCase; домен желателен, если имя общее | `ConnectWorkspaceDialog.vue` |
| Роуты | camelCase файл + экспорт с доменом | `worktreesRoutes.ts` → `worktreesRoutes` |
| Стор | camelCase файл; id/имя стора с доменом | `worktreesStore.ts` |
| Helper | `helper.ts` в корне модуля; при необходимости — `dialogs/helper.ts` | |

Не называй файлы модуля без домена (`Page.vue`, `routes.ts`, `store.ts`, `Button.vue` в чужом домене) — домен должен быть в корне имени.

## Роуты (views)

- Экспортируй массив `RouteRecordRaw[]` из `<domain>Routes.ts`.
- Подключай в `frontend/src/router/index.ts` через spread: `...worktreesRoutes`.
- Lazy-import страницы из модуля: `() => import('@/views/<domain>/<Domain>Page.vue')`.
- Детали guards/lifecycle — по [vue-router-best-practices](../vue-router-best-practices/SKILL.md).

## Стор

- Клади стор **в папку модуля**, если состояние принадлежит только этому домену.
- Setup store + TypeScript; паттерны — [vue-pinia-best-practices](../vue-pinia-best-practices/SKILL.md).
- Глобальное состояние приложения (тема, сессия) может оставаться в `frontend/src/stores/`.

## helper.ts

- Типы домена, константы, provide/inject, небольшие composable-функции модуля.
- Логика, нужная только диалогам — в `dialogs/helper.ts`.
- Не превращай `helper.ts` в свалку: при росте выноси в соседние файлы с доменом в имени.

## Валидация форм

Для любой формы с полями ввода (диалоги, страницы, настройки) **обязательно** используй общий composable:

`frontend/src/composables/useFormValidation.ts` → `useFormValidation`, правила `required` / `minLength` / `maxLength` / `pattern` / `rules`.

Эталон: `frontend/src/views/worktrees/dialogs/ConnectWorkspaceDialog.vue`.

Как разделять ответственность:

| Что | Где |
| --- | --- |
| Состояние значений, ошибки полей, `validate` / `fieldAttrs` / `errorAttrs` | `useFormValidation` |
| Доменные проверки (путь уже в пуле, уникальность имени, …) | чистые функции в `helper.ts` / `dialogs/helper.ts`, возвращают `string \| null` |
| UI ошибки | красный текст под полем + `border-kit-error-text`; `v-bind="form.fieldAttrs(...)"` / `form.errorAttrs(...)` |

```ts
const form = useFormValidation({
  initialValues: { path: '' },
  rules: () => ({
    path: (value) => connectPathProblem(String(value), taken.value),
  }),
})

if (!form.validate()) return
```

Не делай:

- локальный `failure` / `error` `shallowRef` под валидацию полей;
- красную «плашку»-баннер для ошибок поля (только текст под полем);
- новую form-lib (zod, vee-validate, …) без явной просьбы оператора.

`DialogFailure` и похожие типы — только для **неполевых** отказов действия (бизнес-ошибка без конкретного input), не для required/format полей.

## Корневой SFC

- Поверхность композиции модуля: собирает вложенные `components/` / `dialogs/`, подключает helper/store.
- Тяжёлый UI — во вложенный `components/`; модалки — в `dialogs/`.
- Стили: Tailwind по умолчанию; кастомный SCSS только при необходимости и строго по BEM.

## Чеклист нового модуля

- [ ] Папка в нужном корне: `views/` | `layouts/` | `components/`
- [ ] Корневой `.vue` с доменом в имени
- [ ] При маршрутах (views): `<domain>Routes.ts` + регистрация в `router/index.ts`
- [ ] При сторе: `<domain>Store.ts` в модуле
- [ ] Вложенные `components/` / `dialogs/` / `helper.ts` — только при реальной нужде
- [ ] Имена внутренних `.vue` начинаются с домена (PascalCase)
- [ ] Прочитаны связанные скиллы под задачу (vue / router / pinia / tailwind / scss+bem)
- [ ] При формах с полями: `useFormValidation`, без локального хардкода ошибок полей

## Антипаттерны

- Голые `.vue` в корне `views/`, `layouts/` или `components/` без папки домена
- Общие имена без домена: `Table.vue`, `routes.ts`, `Button.vue` внутри чужого модуля
- Пустые `components/` / `dialogs/` «на вырост»
- Дублирование общего UI из `components/` внутри views/layouts
- Стор домена в `src/stores/`, если он используется только этим модулем
- Роуты или page-файлы в `layouts/` / `components/`
- Хардкод валидации полей формы вместо `useFormValidation`
