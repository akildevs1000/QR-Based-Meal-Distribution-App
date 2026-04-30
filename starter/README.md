# Starter Kit — Backend + Admin

A self-contained pattern kit for spinning up a new project that looks and behaves like this one. Two pieces only: a Laravel API backend and a Vite/React admin frontend.

This folder is **not** a runnable app. It is the rulebook + recipe + verbatim snippets that let you (or Claude) bootstrap a fresh project in a few hours and have it match the existing visual and architectural language.

## What's in here

| File | Audience | Purpose |
| --- | --- | --- |
| [CLAUDE.md](CLAUDE.md) | Claude (auto-loaded) | Bootstrap instructions for an AI assistant |
| [PHILOSOPHY.md](PHILOSOPHY.md) | Anyone | The 10 non-negotiables. Read first. |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Anyone | Tokens, components, typography, status patterns |
| [BACKEND.md](BACKEND.md) | Backend dev | Laravel + Sanctum conventions |
| [ADMIN.md](ADMIN.md) | Frontend dev | React 19 + Vite + Tailwind + react-query conventions |
| [BOOTSTRAP.md](BOOTSTRAP.md) | Day 1 | Empty folder → working auth loop. Step by step. |
| [FEATURE-RECIPE.md](FEATURE-RECIPE.md) | Every feature | How to add resource X end-to-end |
| [snippets/](snippets/) | Copy-paste source | Verbatim files + templates |

## Read order

**Humans:** PHILOSOPHY → DESIGN-SYSTEM → BACKEND → ADMIN → BOOTSTRAP → FEATURE-RECIPE.

**Claude:** read [CLAUDE.md](CLAUDE.md) first; it tells you which order to read the rest.

## How to use this kit

### Inside this repo (clone of this lineage)
1. Decide your new project root. Could be a sibling folder.
2. Copy `starter/` and `admin/src/components/` (the primitives) into the new root.
3. Follow [BOOTSTRAP.md](BOOTSTRAP.md).

### As a totally separate repo
1. Copy this whole `starter/` folder into the new repo root.
2. Also copy `admin/src/components/` from this repo (those are the reusable UI primitives — DatePicker, DateRangePicker, Select, Pagination, Layout, SideNavBar, ProtectedRoute, RowMenu).
3. Follow [BOOTSTRAP.md](BOOTSTRAP.md).

## What this kit deliberately does not include

- Runnable scaffolding scripts. Bootstrapping a Laravel + Vite project takes two commands; a script would just hide them.
- A Storybook / component playground. The components are simple enough; their contracts are documented in [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md).
- Per-feature business logic. That is project-specific by definition.
- Frontends other than the admin (no scanner, no counter, no kiosk). Add those only when needed.

## Source of truth

The canonical implementations live in [../admin/](../admin/) and [../backend/](../backend/) of this repo. When this kit and the implementation disagree, the implementation wins — update the kit.
