# UI Component Library

This folder (`apps/web/src/components/ui/`) is the shared component library for the Snio
web app. It is the single place where reusable, presentational building blocks live. Think
of it the way the CAFM project used its primitives: route and feature code stays thin and
declarative, the repetition lives once inside a primitive.

If you are building or changing UI, check here first. If a primitive almost fits, extend it
through a slot before reaching for a one-off.

## Two rules that keep this clean

1. **Slots over flags.** When a component needs to grow, add a `ReactNode` slot prop
   (`media`, `trailing`, `action`, `title`), not a scalar config flag (`showBadge`,
   `variant="x"`, `dense`). Scalar flags accumulate into `if` branches and nested
   conditionals. A slot takes arbitrary JSX and never explodes. A god component is fine as
   long as its props are slots, not config.

2. **Same species, same primitive.** Do not force one component onto everything. An
   elevated, clickable card item is an `EntityCard`. A flat dense divided row is a
   `ListRow`. A titled section is a `SectionCard`. A full page container is a `Page`. Using
   the wrong primitive (e.g. forcing flat notification rows into `EntityCard`) creates
   visual regressions and flag soup. Pick the matching species.

Directory stays **flat**. No subfolders at this size. Revisit only past ~40 files.

## Layout

- **Page** `width?: 'sm' | 'md' | 'lg' | 'xl'` (default `xl`), `className?`, `children`.
  The page container: `mx-auto px-6 py-10` plus a max width. Widths map to
  `sm=max-w-lg`, `md=max-w-2xl`, `lg=max-w-3xl`, `xl=max-w-4xl`. Override an odd width via
  `className`.
- **PageHeader** `title`, `action?`. The `h1` plus an optional right-aligned action slot
  (usually a primary `Button`). Use for simple page headers. Rich headers (avatar plus
  title plus action cluster, as in clan-detail and event-detail) stay custom, they are not
  a `PageHeader` case.

## Surfaces

- **Card** `tone?: 'base' | 'muted' | 'accent'`, `padding?: 'none' | 'sm' | 'md' | 'lg'`,
  `contextMenu?: ContextMenuEntry[]`, plus standard `div` attributes. The raw surface
  primitive everything else builds on.
- **EntityCard** `media?`, `title`, `subtitle?`, `trailing?`, `onClick?`,
  `contextMenu?`, `className?`. The elevated, clickable list item: media on the left,
  title plus subtitle in the middle, optional trailing on the right. Wraps itself in a
  button when `onClick` is set. Used for ClanCard, EventCard, and future Tournament/Org
  cards.
- **SectionCard** `title`, `children`, `className?`. A `Card` with a heading and a
  `divide-y` body. Pass the rows as children. An empty or loading message can be a child
  too, it sits above the divided rows without a divider.

## Lists

- **ListRow** `media?`, `trailing?`, `onClick?`, `active?`, `className?`, `children`.
  The flat, dense, divided row (the non-elevated species). `media | flex-1 content |
  trailing`. Default `py-3 gap-3`, override density via `className` (cn uses tailwind-merge,
  so `className="py-4 gap-4"` wins). Used inside `SectionCard`. Behavior-heavy rows
  (e.g. member-row with its role popover) keep their hooks and state in the feature
  component and only use `ListRow` for layout, passing the stateful cluster as `trailing`.
- **Pager** `page`, `hasPrev`, `hasNext`, `onPrev`, `onNext`. The cursor pagination
  control. Renders nothing when both `hasPrev` and `hasNext` are false, so no guard needed
  at the call site.
- **EmptyState** `action?`, `children`. A muted, centered card with a message and an
  optional action button.

## Atoms

- **Avatar** `src?`, `fallback` (required), `size?` (px, default 48), `circle?`,
  `className?`. Image when `src` is set, otherwise the `fallback` text (initials or tag) in
  a muted box. Radius is computed as `0.28 * size` (or full when `circle`), fallback text
  is `font-semibold`, font size scales at `size >= 56`. Replaces every hand-built logo and
  avatar.
- **Skeleton** `className?`. A single `animate-pulse` block. Size and shape via `className`.
- **SkeletonCard** no props. A card-shaped skeleton matching `EntityCard` (avatar plus two
  lines). The grid that holds them stays in the page, since columns differ per list.
- **Centered** `children`. A `min-h-[50vh]` centered muted text block for loading and
  not-found states on detail pages.
- **Button**, **Field** (TextField, PasswordField), **Segmented**, **SearchInput**,
  **ScrollHints**: existing atoms, unchanged.

## Complex

- **Table**: config-driven data table. This is the one place a heavy prop interface is
  justified, because every row is structurally identical and only data differs. Do not
  copy this pattern onto cards or rows.
- **Modal**, **PagedModal**: dialog shells.
- **ContextMenu**: a global, portal-rendered right-click menu. `ContextMenuRoot` is mounted
  once in `main.tsx`. Any `Card`-based component (Card, EntityCard) and Button accept a
  `contextMenu?: ContextMenuEntry[]` prop. Internally they wire it through the
  `withContextMenu(items?, onContextMenu?)` factory, which is generic over the element
  type. To add context-menu support to a new element: destructure `contextMenu` and
  `onContextMenu`, then set `onContextMenu={withContextMenu(contextMenu, onContextMenu)}`.
  The native HTML `contextMenu` attribute must be removed from the props interface via
  `Omit<HTMLAttributes<...>, 'contextMenu'>` so the typed prop does not collide with it.

## Conventions recap

- Library is `components/ui/`, flat, English file names, no inline comments.
- Compact code, `if () return` inline without braces where a single statement.
- Detail-page rich headers stay custom; only simple headers use `PageHeader`.
- When extending: ask "new slot or new flag". Slot is welcome, a flag that opens an `if` is
  a smell, solve it as a slot instead.
