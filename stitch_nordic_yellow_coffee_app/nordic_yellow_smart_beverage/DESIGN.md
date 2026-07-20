---
name: Nordic Yellow Smart Beverage
colors:
  surface: '#FFFFFF'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#444653'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#747684'
  outline-variant: '#c4c5d5'
  surface-tint: '#3557bc'
  primary: '#002068'
  on-primary: '#ffffff'
  primary-container: '#003399'
  on-primary-container: '#8aa4ff'
  inverse-primary: '#b5c4ff'
  secondary: '#6f5d00'
  on-secondary: '#ffffff'
  secondary-container: '#fdd816'
  on-secondary-container: '#705e00'
  tertiary: '#012f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#034800'
  on-tertiary-container: '#4ebe3c'
  error: '#CC0008'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b5c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#153ea3'
  secondary-fixed: '#ffe164'
  secondary-fixed-dim: '#e7c400'
  on-secondary-fixed: '#221b00'
  on-secondary-fixed-variant: '#544600'
  tertiary-fixed: '#8afc71'
  tertiary-fixed-dim: '#6edf58'
  on-tertiary-fixed: '#012200'
  on-tertiary-fixed-variant: '#045300'
  background: '#F5F5F5'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
  primary-hover: '#002B80'
  text-primary: '#111111'
  text-secondary: '#484848'
  border: '#DFDFDF'
  warning: '#E87400'
typography:
  display:
    fontFamily: Noto Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
  h1:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 41.6px
  h1-mobile:
    fontFamily: Noto Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  h2:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 31.2px
  h3:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 23.4px
  product-name:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 24px
  price:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 31.2px
  body:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  label:
    fontFamily: Noto Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
  dimensions:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 21px
  caption:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 64px
  container-max: 1400px
  gutter-desktop: 20px
  gutter-mobile: 8px
---

## Brand & Style

The design system is rooted in **Scandinavian Functionalism**, prioritizing utility, accessibility, and democratic design. It evokes a sense of reliability and warmth, drawing direct inspiration from the "IKEA" aesthetic to create a friendly yet highly organized user experience. The brand personality is practical, efficient, and optimistic.

The chosen design style is **Corporate / Modern** with a strong emphasis on **Flat Design**. It avoids excessive ornamentation, instead using a rigid grid, bold primary colors, and high-quality product photography to create hierarchy. All visual elements follow a mathematical geometric logic, utilizing a base unit of 8px (derived from the 4px base unit specified in the reference) to ensure consistent spatial relationships across the interface.

## Colors

The palette is dominated by the high-contrast pairing of **IKEA Blue** and **IKEA Yellow**. 

- **Primary (Blue):** Reserved for core navigation, primary actions, and brand identification. It provides the "anchor" for the UI.
- **Secondary (Yellow):** Used strategically for attention-grabbing elements like promotional tags, "New" status badges, and critical Call-to-Action buttons. It should never be used for text on light backgrounds to ensure accessibility.
- **Tertiary (Green):** Specifically allocated for "Sustainability" markers and "In Stock" indicators, reinforcing environmental responsibility.
- **Neutral:** A spectrum of grays handles secondary information, borders, and background layering.

The system defaults to **Light Mode**, utilizing off-white surfaces (`#F5F5F5`) to reduce glare while maintaining a clean, airy feel.

## Typography

The system utilizes **Noto Sans** for its universal clarity and functional aesthetic. 

- **Headings:** Bold weights (700) and tight line heights (1.3x) create a structured hierarchy.
- **Product Details:** Product names use 700 weight in sentence case. 
- **Technical Specs:** **JetBrains Mono** is employed specifically for dimensions, volume (ml/oz), and technical beverage data, ensuring numerals are distinct and legible.
- **Scaling:** On mobile devices, H1 titles scale down to 28px to maintain readability within narrower viewports.
- **Readability:** Body text maintains a 1.5x line height to ensure comfortable scanning of product descriptions.

## Layout & Spacing

This design system uses a **Fixed Grid** approach for desktop and a **Fluid Grid** for mobile. 

- **Desktop:** A 12-column grid with a maximum width of 1400px. Content is centered with 20px margins. Product grids use a 20px gap.
- **Mobile:** A 2-column fluid grid with 8px gutters and 20px side margins.
- **Rhythm:** All spacing is derived from a 4px base unit. Section-level vertical spacing is set to 64px to provide significant "breathing room" between product categories, while internal component spacing follows a tighter 8px/16px logic.
- **Alignment:** All elements, including the beverage icon mark, must align to the baseline grid to maintain the mathematical rigor of the Scandinavian style.

## Elevation & Depth

Depth is used sparingly and only to denote interactivity or containment.

- **Level 0 (Flat):** The default state for the majority of the UI. Separation is achieved through background color shifts (e.g., `#FFFFFF` cards on a `#F5F5F5` background) or 1px `#DFDFDF` borders.
- **Level 1 (Low):** Applied to product cards (`0 1px 3px rgba(17,17,17,0.06)`). This provides a subtle lift that signals the card is an interactive object.
- **Level 2 (Medium):** Used for hover states and dropdown menus (`0 4px 12px rgba(17,17,17,0.08)`).
- **Level 3 (High):** Reserved for modals and product "Quick View" overlays (`0 8px 24px rgba(17,17,17,0.12)`).

Avoid shadows on buttons; use color state changes (Primary to Primary Hover) to indicate interaction instead.

## Shapes

The shape language is primarily **Soft** and functional. 

- **Standard (4px):** Applied to buttons, cards, inputs, and chips. This radius is large enough to feel friendly but small enough to maintain the structural integrity of a grid-based layout.
- **Small (2px):** Used for checkboxes and tiny status badges.
- **Large (12px):** Reserved for significant containers like Modals or Hero banners.
- **Pill (9999px):** Exclusive to icon-only buttons, avatars, and circular quantity badges.

The beverage mug icon serves as the primary brand mark and should always maintain its original geometric proportions and rounded path endings.

## Components

### Buttons
- **Primary:** Height 44px, Blue background, White text. Bold Noto Sans 15px.
- **Secondary:** White background, Blue border (2px), Blue text.
- **CTA (Yellow):** IKEA Yellow background, Near-Black text. Used for "Add to Cart" or "Order Now."

### Beverage Product Cards
- White background with 1px border. 
- **Image:** 1:1 aspect ratio, flush to the top. Photography should show the beverage in a clean, natural setting.
- **Content:** 16px internal padding. Price is emphasized at 24px/700 weight.

### Quantity Steppers
- Compact 100px width.
- Blue +/- buttons with a central number displayed in JetBrains Mono.
- 4px border radius on the total container.

### Status Badges & Chips
- **New:** Yellow background with Black text.
- **In Stock / Sustainable:** Green background with White text.
- **Out of Stock:** Error Red background or grayscale with "Limited Availability" warning orange.

### Input Fields
- 44px height, 1px Gray border.
- Focus state: 2px Blue border.
- Monospace font for numerical inputs to ensure alignment.

### Beverage Ordering Status
- Progress bars should use the Primary Blue. 
- Success states use the Tertiary Green.
- Use the coffee mug SVG at reduced scale (24px) for status tracking icons.