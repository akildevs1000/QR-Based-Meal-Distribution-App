---
name: Meal Distribution Professional System
colors:
  surface: "#0b1326"
  surface-dim: "#0f131e"
  surface-bright: "#353946"
  surface-container-lowest: "#060e20"
  surface-container-low: "#131b2e"
  surface-container: "#171f33"
  surface-container-high: "#222a3d"
  surface-container-highest: "#2d3449"
  on-surface: "#dae2fd"
  on-surface-variant: "#c4c6d0"
  inverse-surface: "#dee2f2"
  inverse-on-surface: "#2c303d"
  outline: "#8c909f"
  outline-variant: "#424754"
  surface-tint: "#adc6ff"
  primary: "#d8e2ff"
  on-primary: "#122f5f"
  primary-container: "#adc6ff"
  on-primary-container: "#385283"
  inverse-primary: "#455e90"
  secondary: "#bcc7de"
  on-secondary: "#263143"
  secondary-container: "#3c475a"
  on-secondary-container: "#aab5cc"
  tertiary: "#d3e4fe"
  on-tertiary: "#213145"
  tertiary-container: "#b7c8e1"
  on-tertiary-container: "#435469"
  error: "#ffb4ab"
  on-error: "#690005"
  error-container: "#93000a"
  on-error-container: "#ffdad6"
  primary-fixed: "#d8e2ff"
  primary-fixed-dim: "#adc6ff"
  on-primary-fixed: "#001a42"
  on-primary-fixed-variant: "#2c4677"
  secondary-fixed: "#d8e3fa"
  secondary-fixed-dim: "#bcc7de"
  on-secondary-fixed: "#111c2d"
  on-secondary-fixed-variant: "#3c475a"
  tertiary-fixed: "#d3e4fe"
  tertiary-fixed-dim: "#b7c8e1"
  on-tertiary-fixed: "#0b1c2f"
  on-tertiary-fixed-variant: "#38485d"
  background: "#0f131e"
  on-background: "#dee2f2"
  surface-variant: "#303541"
  primary-accent-alt: "#3B82F6"
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: "600"
    lineHeight: 40px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "600"
    lineHeight: 32px
    letterSpacing: -0.015em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: -0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.03em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base-unit: 4px
  rhythm: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is engineered for high-density information environments and executive oversight. The brand personality is analytical, authoritative, and precise, moving away from decorative aesthetics toward a functionalist, high-end SaaS aesthetic. It evokes a sense of control and reliability through structured layouts and a restrained visual language.

The style leverages **Minimalism** and **Corporate Modern** influences. It prioritizes content clarity over ornamental flourishes, using subtle transparency and fine lines to create a sense of technical sophistication. The emotional response is one of calm efficiency, designed to reduce cognitive load for users managing complex data sets.

## Colors

The palette is anchored in a sophisticated dark theme. The foundation utilizes deep navy-blacks (#0F172A) for primary backgrounds to provide maximum contrast for data visualization. Surface layers use #1E293B to create subtle hierarchy without breaking the dark-mode immersion.

The primary accent is a refined Blue (#3B82F6), used sparingly for call-to-actions, active states, and critical paths. Success, warning, and error states should utilize desaturated versions of green, amber, and red to maintain the professional tone. Borders use a low-opacity slate to define boundaries without introducing visual noise.

## Typography

This design system utilizes **Inter** for its exceptional legibility in technical interfaces. The type scale is strictly hierarchical, favoring tighter tracking (letter-spacing) in headings to create a dense, "locked-in" professional feel.

Large headings use a semi-bold weight to command attention, while body text remains regular for long-form readability. Labels and utility text leverage slightly increased tracking and medium weights to ensure clarity even at small scales, which is critical for data-heavy tables and dashboards.

## Layout & Spacing

The design system employs a **Fluid Grid** based on an 8px rhythmic unit, allowing for precision and scalability. The layout is structured around a 12-column system that adapts to the viewport, ensuring that data density is maximized on larger displays while remaining accessible on smaller screens.

Consistency is maintained through a strict spacing scale. Elements are separated by predictable intervals (16px or 24px) to create a visual "tempo" that aids in navigation. Margin and padding values should always be multiples of the 4px base unit to ensure alignment across different component types.

## Elevation & Depth

Visual hierarchy is achieved through **Low-Contrast Outlines** and **Tonal Layering** rather than aggressive shadows. Surfaces are defined by 1px borders with low opacity (typically 50% of the border color) to create a sharp, architectural feel.

Depth is subtly introduced using restricted glassmorphism—specifically, a light backdrop blur (8px to 12px) applied only to floating elements like navigation bars or dropdown menus. Shadows, when used, are "ambient" and highly diffused, acting as a soft glow to lift active modals or menus off the primary surface without creating heavy dark spots in the UI.

## Shapes

The shape language is professional and "Soft" (Level 1). A base radius of 4px (0.25rem) is applied to most UI components, including buttons and input fields. This slight rounding maintains a friendly modern edge while preserving the structural, grid-aligned integrity required for a professional SaaS tool.

Larger containers, such as dashboard cards, may use a 6px or 8px radius to gently distinguish them from smaller atomic elements. Roundedness should never exceed 8px, as pill-shaped or highly rounded elements detract from the data-driven aesthetic.

## Components

### Buttons

Primary buttons are solid #3B82F6 with white or high-contrast text. They are sharp-edged with a 4px radius, emphasizing stability. Secondary buttons use an outlined style with a 1px border or a subtle tonal shift (#1E293B) to maintain hierarchy.

### Cards

Cards are the primary container for data. They feature a solid #1E293B background, a 1px border (#334155), and zero to minimal shadows. They are designed to sit flat on the #0F172A background, creating a tiled, dashboard-like appearance.

### Input Fields

Inputs are desaturated and inset, using a dark background (#0F172A) and a 1px border. The focus state is indicated by a clean primary blue border and a subtle outer glow.

### Data Tables

Tables are the core of this design system. They use a "no-border" horizontal row style to emphasize the data flow, with subtle dividers (0.5px) and a fixed-width font for numerical data to ensure column alignment.

### Chips & Badges

Chips are rectangular with a 2px or 4px radius. They use low-saturation background colors to indicate status (e.g., a muted dark green for "Active") to ensure they do not compete with primary actions.
