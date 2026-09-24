---
name: FlashLearn
description: Tactile active-recall learning interface engineered with Framework7 Svelte 5 and Impeccable design principles.
colors:
  primary: "#0F766E" # Deep Teal - focused, studious, crisp
  primary-container: "#CCFBF1" # Light Teal background
  primary-deep: "#115E59" # Dark Teal hover
  accent: "#EA580C" # Vivid Amber/Tangerine for flashcard review & active highlights
  accent-soft: "#FFEDD5"
  neutral-bg: "#F8FAFC" # Cool Alabaster light background
  surface: "#FFFFFF"
  surface-elevated: "#FFFFFF"
  surface-subtle: "#F1F5F9"
  border-subtle: "#E2E8F0"
  border-strong: "#CBD5E1"
  text-main: "#0F172A" # Deep Slate 900
  text-muted: "#475569" # Slate 600
  text-subtle: "#94A3B8" # Slate 400
  success: "#16A34A"
  success-soft: "#DCFCE7"
  error: "#DC2626"
  error-soft: "#FEE2E2"
  info: "#0369A1"
  info-soft: "#E0F2FE"
  warning: "#D97706"
  warning-soft: "#FEF3C7"
  badge-materi-bg: "#DBEAFE"
  badge-materi-text: "#1E40AF"
  badge-quiz-bg: "#FEF3C7"
  badge-quiz-text: "#92400E"
  slate-dark: "#1E293B"
  slate-deep: "#334155"
rounded:
  xs: "6px"
  sm: "8px"
  sm-md: "10px"
  md: "12px"
  md-lg: "14px"
  lg: "18px"
  xl: "20px"
  pill: "24px"
  full: "9999px"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.75rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.04em"
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
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-accent:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  card-module:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System

<!-- impeccable:design-schema 1 -->

## Overview

FlashLearn's design philosophy rejects bland "AI slop" (uniform cards, muddy purples, low-contrast grays) in favor of **tactile study physics**, high-contrast editorial typography, and crisp physical affordances adapted to both iOS and Material Design environments via Framework7 Svelte 5.

## Colors

- **Primary (`#0F766E`)**: Deep Teal. Chosen for intellectual focus and mental stamina without the sterile coldness of default blue.
- **Accent (`#EA580C`)**: Electric Tangerine. Reserved for high-urgency active recall moments: Flashcard trigger button, flipped answers, and streak badges.
- **Surface & Backgrounds**: Crisp `#F8FAFC` base with stark `#FFFFFF` elevated cards to preserve visual hierarchy.
- **Status Tones**: High-legibility green (`#16A34A`) for correct answers and soft crimson (`#DC2626`) for misconceptions.

## Typography

- **Headlines & Titles**: *Plus Jakarta Sans* (tight tracking `-0.02em`, muscular weights 700/800) for energetic guidance.
- **Reading Body**: *Inter* at 16px with relaxed 1.6 line-height for effortless reading of long educational materials.
- **Labels & Micro-copy**: 13px bold uppercase tracking (`+0.04em`) for badges, tags, and workspace chips.

## Layout

- **Framework7 Responsive Shell**:
  - Phone (<768px): Bottom tabbar navigation, pull-to-refresh, slide-in sheets for flashcards, thumb-friendly tap targets (minimum 44x44px).
  - Tablet/Desktop (≥768px): Multi-pane master-detail view with fixed sidebar, roomy reading column (max 720px width for reading comfort), and floating flashcard modal.

## Elevation & Depth

- **Tactile Physics**: Minimalist clean borders (`1px solid #E2E8F0`) layered with directional ambient shadows:
  - Base Card: `0 1px 3px 0 rgba(15, 23, 42, 0.05)`
  - Elevated Card: `0 8px 24px -4px rgba(15, 23, 42, 0.08)`
  - Active 3D Flashcard: `0 20px 35px -10px rgba(15, 23, 42, 0.15)` with `perspective: 1000px` and `transform-style: preserve-3d`.

## Shapes

- Continuous squircle curves using `14px` for interactive cards and `20px` for top-level learning module surfaces.
- Flashcard decks use generous rounded corners (`24px`) with physical edge bevel highlights (`inset 0 1px 0 rgba(255, 255, 255, 0.8)`).

## Components

1. **Flashcard 3D Card**:
   - Flip mechanism: Click or swipe flips the card 180 degrees along the Y-axis smoothly over 400ms (`cubic-bezier(0.34, 1.56, 0.64, 1)` bounce).
   - Front Face: Question prompt, category chip, hint toggle.
   - Back Face: Correct answer, rich explanatory text, and 4 spaced-repetition rating buttons (*Again / Hard / Good / Easy*).
2. **Quiz Answer Choice**:
   - Large tappable tile with radio indicator, active tactile press state (`scale(0.98)`), instant visual feedback upon submission.
3. **Workspace Card**:
   - Visual badges distinguishing *Materi*, *Quiz*, or *Materi + Quiz*.
   - Quick action bar (Launch, Share Link, API Key, Edit).

## Do's and Don'ts

### Do's:
- **Do** make flashcard flipping feel physical with fluid 3D transitions and clear cues.
- **Do** provide immediate positive or corrective feedback on quiz submissions.
- **Do** respect device conventions (iOS swipe back gestures, Material ripple effects).
- **Do** keep typography readable with strong contrast against background surfaces.

### Don'ts:
- **Don't** use generic purple gradients or monotonous AI-generated card grids.
- **Don't** hide flashcards behind extra loading screens or paywalls.
- **Don't** use tiny touch targets smaller than 44x44px on mobile screens.
- **Don't** put low-contrast light gray text on light colored backgrounds.
