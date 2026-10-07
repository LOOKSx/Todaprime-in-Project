---
name: Todaprime
description: Precision distraction-free daily planner and habit orchestrator
colors:
  primary: "#6366f1"
  primary-hover: "#4f46e5"
  primary-subtle: "rgba(99, 102, 241, 0.12)"
  primary-glow: "rgba(99, 102, 241, 0.35)"
  prime-gold: "#f59e0b"
  prime-glow: "rgba(245, 158, 11, 0.4)"
  accent: "#10b981"
  accent-hover: "#059669"
  accent-subtle: "rgba(16, 185, 129, 0.12)"
  warning: "#f59e0b"
  warning-subtle: "rgba(245, 158, 11, 0.12)"
  danger: "#f43f5e"
  danger-subtle: "rgba(244, 63, 94, 0.12)"
  bg-app-dark: "#090d16"
  bg-surface-dark: "#111827"
  bg-surface-elevated-dark: "#1a2333"
  text-main-dark: "#f8fafc"
  text-secondary-dark: "#94a3b8"
  text-muted-dark: "#64748b"
  border-dark: "rgba(255, 255, 255, 0.08)"
  bg-app-light: "#f6f8fb"
  bg-surface-light: "#ffffff"
  bg-surface-elevated-light: "#f1f5f9"
  text-main-light: "#0f172a"
  text-secondary-light: "#334155"
  text-muted-light: "#64748b"
  border-light: "rgba(15, 23, 42, 0.09)"
typography:
  display:
    fontFamily: "Outfit, 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Outfit, 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Outfit, 'Noto Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.01em"
rounded:
  sm: "8px"
  md: "14px"
  lg: "20px"
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
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
---

# Design System

## Overview
Todaprime's design system embodies Swiss minimalism and tactile digital craftsmanship. It is tailored for high-frequency daily operation, prioritizing calm focus, scannability, and lightning-fast user interaction without visual clutter.

## Colors
The color palette employs an Obsidian deep canvas in dark mode (`#090d16`) with subtle ambient atmospheric glows, and an Architectural Porcelain canvas in light mode (`#f6f8fb`).
- **Primary Indigo (`#6366f1` / `#4338ca`)**: Focus actions, active tabs, timeline milestones.
- **Prime Gold (`#f59e0b`)**: Premium highlights, achievement streaks, 100% completion celebration.
- **Emerald Accent (`#10b981`)**: Completed tasks, healthy progress badges.
- **Rose Danger (`#f43f5e`)**: Urgent priority, destructive confirmation.
- **Contrast Ratios**: Exceeds WCAG AA standard with all body copy >= 4.5:1 against surface tokens.

## Typography
Type pairings are centered around **Outfit** for clean geometric Latin characters with distinctive modern personality, seamlessly harmonized with **Noto Sans Thai** for optimal Thai baseline alignment and reading comfort.
- Tight tracking on headings (`-0.025em`) for punchy editorial clarity.
- Balanced line height (`1.55`) for tasks, descriptions, and daily notes to eliminate eye strain.

## Layout
- **Container Max-Width**: Centered 1360px grid with balanced fluid gutters.
- **Multi-Device Responsiveness**: Fluid transition across mobile (<640px), tablet (<1024px), and desktop/ultrawide displays.
- **Rhythm**: 8px baseline grid with consistent vertical rhythm.

## Elevation & Depth
Depth is created through single elevation definitions rather than stacked borders and heavy shadows.
- Dark mode utilizes soft translucent borders (`rgba(255, 255, 255, 0.08)`) with diffuse low-opacity shadows.
- Light mode utilizes crisp hairline borders (`rgba(15, 23, 42, 0.09)`) with layered ambient diffusion.

## Shapes
- Cards & Modals: `14px` to `20px` corner radii for gentle modern framing.
- Small Controls & Badges: `8px` or full pill (`9999px`) for quick tactile thumb-friendly targets.

## Components
- **Task Item Card**: Interactive state transitions, swipe/hover actions, strike-through completion animation, priority indicators.
- **Day Timeline**: Visual schedule bar displaying daily density and completed milestones.
- **Quick Action Bar**: Sticky or accessible bar for rapid task capture and status filtering.

## Do's and Don'ts
- **Do**: Maintain crisp typographic hierarchy with distinct weight steps.
- **Do**: Provide immediate visual and auditory feedback on task completion.
- **Don't**: Introduce nested cards within cards.
- **Don't**: Use raw generic gradients or uncalibrated high-saturation backgrounds.
- **Don't**: Hide primary navigation behind unnecessary extra clicks.
