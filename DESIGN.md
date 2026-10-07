---
name: Todaprime
description: Classic archival daily planner & executive journal with literary warmth
colors:
  primary: "#1e3a5f"
  primary-hover: "#152942"
  primary-subtle: "rgba(30, 58, 95, 0.08)"
  gold: "#996515"
  gold-glow: "rgba(153, 101, 21, 0.25)"
  accent: "#1e5138"
  accent-hover: "#143826"
  accent-subtle: "rgba(30, 81, 56, 0.08)"
  warning: "#b45309"
  warning-subtle: "rgba(180, 83, 9, 0.08)"
  danger: "#9f1239"
  danger-subtle: "rgba(159, 18, 57, 0.08)"
  bg-app-dark: "#0f1216"
  bg-surface-dark: "#181c22"
  bg-surface-elevated-dark: "#222730"
  text-main-dark: "#f5f2eb"
  text-secondary-dark: "#c9c1b2"
  text-muted-dark: "#857e72"
  border-dark: "rgba(216, 207, 190, 0.12)"
  bg-app-light: "#f7f4ed"
  bg-surface-light: "#ffffff"
  bg-surface-elevated-light: "#efeae0"
  text-main-light: "#1c1917"
  text-secondary-light: "#57534e"
  text-muted-light: "#8c827a"
  border-light: "#d8cfbe"
typography:
  display:
    fontFamily: "'Lora', 'Noto Serif Thai', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.75rem, 3.5vw, 2.35rem)"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "'Lora', 'Noto Serif Thai', Georgia, 'Times New Roman', serif"
    fontSize: "1.2rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Sarabun', 'Lora', Georgia, -apple-system, BlinkMacSystemFont, serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "0.01em"
  label:
    fontFamily: "'Lora', 'Noto Serif Thai', Georgia, serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.sm}"
    padding: "10px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System

## Overview
Todaprime's Classic Archival design system departs from cold, generic AI-generated interfaces. It draws inspiration from fine British stationery, Oxford study rooms, leather-bound planners, and editorial journals. The atmosphere is warm, dignified, tactile, and deeply readable (น่าอ่าน สบายตา).

## Colors
- **Warm Paper Vellum (`#f7f4ed`)**: In light mode, creates a soothing, non-fatiguing reading canvas reminiscent of antique book paper.
- **Midnight Slate (`#0f1216` / `#181c22`)**: In dark mode, provides rich, deep mahogany-slate surfaces with warm parchment hairlines.
- **Oxford Navy (`#1e3a5f`)**: Primary ink for authoritative headers, active navigation, and primary actions.
- **Antique Gold (`#996515` / `#d4a359`)**: Accent highlights representing milestones, achievements, and warm brass book clasps.
- **Evergreen Library Green (`#1e5138`)**: Completed task checkmarks, success seals, and healthy streaks.
- **Wax Crimson (`#9f1239`)**: High priority warnings and critical deadlines.

## Typography
- **Headings & Badges**: **Lora** (Latin) paired with **Noto Serif Thai**. Features handcrafted calligraphy serifs, balanced proportions, and dignified presence.
- **Body & Tasks**: **Sarabun** (Thai) with tuned leading (1.65) and generous kerning for effortless reading comprehension.

## Layout
- Symmetrical, balanced grid with clear horizontal hairline dividers.
- Thoughtful whitespace, reminiscent of classic book margins and journal pages.

## Elevation & Depth
- Crisp 1px parchment/brass borders instead of blurry synthetic drop shadows.
- Soft pressed paper feel (`box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.03)`).

## Shapes
- Disciplined corner radii (`4px` to `8px`), giving cards the feel of fine stationery index cards or leather notebook folios.

## Components
- **Task Cards**: Styled like entries in a personal leather diary or executive ledger, with a stamp-like checkmark and fine ink borders.
- **Header & Banners**: Letterpress-inspired typography, subtle ornamental accents, and timeless editorial aesthetic.

## Do's and Don'ts
- **Do**: Use serif typography for headings to convey timeless warmth and human craft.
- **Do**: Maintain generous line spacing and warm neutral paper contrast.
- **Don't**: Use neon blues, purples, or synthetic gradients.
- **Don't**: Over-round elements into cartoonish bubbles.
- **Don't**: Make the UI look like generic SaaS or AI boilerplate.
