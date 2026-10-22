---
name: bem-conventions
description: >-
  Strict BEM (Block Element Modifier) class naming for custom CSS/SCSS. Use when writing
  .scss/.sass, scoped Vue styles that are not Tailwind utilities, or any hand-written
  class selectors. In this project prefer Tailwind; when custom SCSS is required, BEM is
  mandatory. Load with scss-best-practices for Sass authoring.
---

# BEM Conventions

**Project rule:** Prefer Tailwind utilities. Write custom SCSS only when Tailwind cannot express the style. Every custom class in that SCSS **must** follow BEM.

## Naming

```
.block                      → root: .product-card
.block__element             → child: .product-card__title
.block--modifier            → variant/state: .product-card--featured
.block__element--modifier   → element variant: .product-card__title--large
```

- Words inside a segment: kebab-case (`search-field`, not `searchField` / `search_field`).
- One element level only: `.block__element`, never `.block__el1__el2`.
- Modifier always with the base class in markup: `class="btn btn--primary"`, never modifier alone.
- Do not style by `id`. Prefer a single class selector (specificity ~0-1-0).

## Markup

```html
<!-- Good -->
<article class="product-card product-card--featured">
  <h3 class="product-card__title">Title</h3>
  <p class="product-card__body">Text</p>
  <button type="button" class="button button--primary">
    <span class="button__label">Buy</span>
  </button>
</article>

<!-- Bad: nested elements, modifier without base, camelCase -->
<div class="productCard productCard--featured">
  <div class="product-card__header__title">…</div>
  <button class="button--primary">…</button>
</div>
```

Start a **new block** when a child is a reusable component (e.g. `button` inside `product-card`), not another `__element` of the parent.

## SCSS nesting

Nest with `&` so compiled selectors stay flat BEM classes. Max nesting depth ~3 (states, modifiers, media).

```scss
.product-card {
  padding: 1rem;

  &__title {
    margin: 0;
    font-weight: 700;
  }

  &__body {
    margin-top: 0.5rem;
  }

  &--featured {
    border: 2px solid currentColor;
  }

  &__title--large {
    font-size: 1.25rem;
  }
}
```

Compiles to `.product-card`, `.product-card__title`, `.product-card__body`, `.product-card--featured`, `.product-card__title--large` — not chained descendant selectors.

Avoid:

```scss
.product-card {
  .header {           // not BEM
    .title { }        // deep, non-BEM
  }
}
```

## Vue SFC

When using `<style lang="scss" scoped>` with custom classes, name those classes with BEM. Do not invent parallel naming (SMACSS-only, camelCase modules) for the same surface.

Tailwind classes in `class="..."` stay as utilities; BEM applies to **custom** classes you introduce for SCSS rules.

## Checklist

- [ ] Tailwind tried first; SCSS only where needed
- [ ] Block name matches the component/feature
- [ ] Elements use `__`, modifiers use `--`
- [ ] No double `__` chains; reusable children are new blocks
- [ ] Modifier class paired with base class in HTML
- [ ] Sass `&__` / `&--` produce correct flat selectors

## Related

- Module folder and file naming (`views` / `layouts` / `components`): [frontend-modules](../frontend-modules/SKILL.md)
- Sass authoring: [scss-best-practices](../scss-best-practices/SKILL.md)
