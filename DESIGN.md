---
name: blue maruya — Cinematic streaming
description: A shared charcoal and coral cinema for personal movie nights.
colors:
  bg: "#111113"
  surface: "#1c1c20"
  glass: "#25252a"
  text: "#faf9f7"
  muted: "#b9b6b6"
  accent: "#ee6957"
  accent-ink: "#21100c"
  accent-hover: "#ff8c78"
  border: "#3c3c43"
  control-border: "#656269"
  field: "#232327"
  secondary: "#202023"
  secondary-hover: "#333136"
  focus: "#ffae9e"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(32px, 4.1vw, 64px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "25px"
    fontWeight: 700
    letterSpacing: "-0.025em"
  title:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 700
  metadata:
    fontFamily: "DM Sans, sans-serif"
    fontSize: "12px"
rounded:
  control: "8px"
  artwork: "12px"
  dialog: "16px"
  chip: "22px"
  circle: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "32px"
  gutter: "clamp(18px, 3vw, 48px)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 21px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "{colors.accent-ink}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "11px 21px"
  field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.text}"
    rounded: "{rounded.control}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.chip}"
    padding: "10px 18px"
  chip-selected:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.chip}"
    padding: "10px 18px"
  empty-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.artwork}"
    padding: "24px"
---

# Design System: blue maruya

## Overview

**Creative North Star: "Cinematic streaming"**

The approved world is an understated charcoal cinema with warm coral controls and real film artwork. Bold, closely spaced headings provide direction while the quiet surrounding interface gives posters and photographs room to carry the mood.

One visual identity serves Waken, Kristine, and Guest. Their account content remains individual. This document records the implemented system from `dist/cinematic.css` and its supporting HTML and stylesheet cascade; the first-surface composition belongs in `.impeccable/cinematic-surfaces.md`.

**Key Characteristics:**
- Charcoal surfaces and restrained coral emphasis.
- Manrope headings with DM Sans reading text and controls.
- Real movie imagery, softly rounded artwork, and clear action labels.
- Shared visual identity with account-specific content.

## Colors

Warm coral is the single primary accent against charcoal neutrals and nearly white text. Frontmatter contains the normative values; the stylesheet's `glass` variable denotes a raised neutral tone, not a requirement to apply glass effects.

### Primary
- **Cinema coral** (`accent`): primary actions, selected genre chips, progress, and the active desktop navigation underline.
- **Coral hover** (`accent-hover`): primary action feedback.
- **Warm accent ink** (`accent-ink`): dark, legible text on coral controls.
- **Light coral focus** (`focus`): keyboard focus and active mobile navigation text.

### Neutral
- **Charcoal canvas** (`bg`): the surrounding application and login background.
- **Quiet surface** (`surface`) and **raised charcoal** (`glass`): supporting panels and tonal layers.
- **Warm white** (`text`) and **soft gray** (`muted`): primary copy and secondary information.
- **Panel border** (`border`) and **control border** (`control-border`): separate large surfaces and clarify interactive boundaries.
- **Field charcoal** (`field`), **secondary control** (`secondary`), and **secondary hover** (`secondary-hover`): form fields and outlined actions.

**The Shared Cinema Rule.** Keep the charcoal and coral identity consistent across all member profiles; personalization belongs to content and account state.

## Typography

Manrope supplies headings and the wordmark; DM Sans supplies body copy, controls, card titles, and metadata. The pairing combines compact, heavy display text with readable supporting copy. Font values are role-specific, not a fabricated modular scale.

- **Display:** the spotlight title uses the fluid display role; on phones it becomes `clamp(30px, 8vw, 42px)`.
- **Headline:** shelf headings use the headline role and reduce to 22px on phones.
- **Title:** film card titles use the compact title role, with two-line truncation in the supporting stylesheet.
- **Body:** the body role is the default; descriptive paragraphs and form help commonly use 14px.
- **Label and metadata:** bold controls contrast with smaller, muted year and genre information.

The login heading uses Manrope 800 at `clamp(32px, 3.5vw, 46px)` with 1.12 line height, becoming 36px on phones. This is a surface-specific treatment rather than a replacement for the shared display role.

## Layout

Horizontal spacing follows a fluid gutter. Scrollable poster rails, straightforward toolbars, and portrait grids keep browsing dense without enclosing every item in a panel. Most desktop controls have a 44px minimum height; fields use at least 48px. Compact carousel and card affordances retain smaller observed sizes and are not a universal control-size standard.

The desktop header is sticky and 76px tall. At 1200px, search becomes an expandable control and the actor grid becomes five columns. At 900px the actor grid becomes four columns. At 767px the header is 68px tall, navigation moves to a safe-area-aware bottom bar, actor results become two columns, and poster rails use `minmax(145px, 42vw)` columns with 15px gaps. Desktop home filters share a row with utility controls above 1000px.

Desktop login has image and form columns inside a 1380px maximum container. On phones, the form comes first, the photograph follows, and the container caps at 540px. See the surface brief for ordering and content conditions.

## Elevation & Depth

Tonal surfaces and image scrims supply most depth. Primary buttons and poster containers have no added shadow in the cinematic override. Dialogs retain a diffuse `0 20px 70px #0008` shadow. Artwork uses directional dark scrims to preserve text contrast; these image treatments are native to the world.

**The Artwork First Rule.** Use contrast and tonal separation to frame the film artwork; do not add decorative glow to cards or rank labels.

Button color transitions last 0.18s. Background rotation is user-pausable, and reduced-motion settings remove animation and transitions. The sidecar records motion and focus details outside the frontmatter schema.

## Shapes

Controls have gently rounded corners; image containers and supporting panels use the larger artwork radius; dialogs use the dialog radius. Genre chips are pills. Avatar and icon-button silhouettes are circular where the supporting component uses that shape. Thin borders clarify controls without wrapping every film in a box.

## Components

### Buttons

Primary actions use coral with dark text; secondary actions use an outlined charcoal treatment. Both use the label type role and control radius. Hover changes color, keyboard focus receives a light coral outline (3px with 4px offset), and disabled buttons lower opacity to 0.45. Main actions have a 44px minimum height; login submit is 52px tall.

### Inputs / Fields

Fields use charcoal fill, visible neutral borders, and warm white text. Placeholder text is muted. Focus changes the border to coral and the field fill to slightly lighter charcoal. Login fields are 52px tall with leading SVG icons, and password visibility has a dedicated button.

### Navigation

Desktop uses restrained text links with a coral active underline. Mobile uses icon-and-label destinations and a filled active state. Actors is a primary destination alongside discovery, movies, series, saved titles, and history. Installation remains available through login/header or account-menu affordances according to screen size.

### Chips

Genre chips are text-first and scroll horizontally when space is limited. Selected chips use coral fill and bold dark text; unselected chips remain quiet until hover. The select control provides access to the broader genre list.

### Cards / Containers

Poster cards use real portrait artwork, the artwork radius, an adjacent title and metadata, and an independent save action. Actor cards use the same portrait geometry with a text fallback when no photograph exists. Empty and retry panels use the quiet surface, a thin border, and explicit next actions.

### Profile Choices

Three equal-width options select Waken, Kristine, or Guest. Selected profiles use a warm tinted surface and coral avatar; the surrounding theme does not change. The choices share the control radius and remain side by side on phones.

## Do's and Don'ts

### Do:
- **Do** use the shared charcoal and coral identity across all three profiles.
- **Do** use real title artwork and actual per-account viewing progress.
- **Do** preserve visible keyboard focus, readable metadata, and explicit loading, empty, and retry states.
- **Do** keep login and dashboard as separate screens.

### Don't:
- **Don't** turn illustrative mockup titles, artwork, or progress into fabricated account activity.
- **Don't** restore personal color themes, glowing ranks, or decorative pulses.
- **Don't** replace real movie imagery with the approved mockup's illustrative placeholders.
