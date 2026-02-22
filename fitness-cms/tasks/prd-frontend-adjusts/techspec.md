# Technical Specification

**Project Name:** FitToday Frontend Design System Overhaul
**Version:** 1.0
**Date:** 2026-02-22
**Author:** Vinicius Carvalho
**Status:** Draft

---

## Overview

### Problem Statement
FitToday's frontend has inconsistent visual identity across landing page, CMS dashboard, admin panel, and auth screens. The landing page doesn't clearly explain the dual business model (SaaS + marketplace). The pricing section lacks a free tier.

### Proposed Solution
Update the Tailwind design tokens (colors, typography) and apply consistently across all areas. Redesign the landing page with premium aesthetics and clear dual-flow pricing. Refresh CMS, admin, and auth screens with new palette.

### Goals
- Unified fitness-oriented design system across all 4 areas
- Clear communication of two business flows on landing page
- Attractive Free/Pro pricing section
- Zero functional changes — purely visual

---

## Scope

### In Scope
- `tailwind.config.ts` — New primary color palette
- `globals.css` — Fix focus ring, add global Outfit font usage
- `app/(public)/site/page.tsx` — Full landing page redesign
- `app/(dashboard)/layout.tsx` — Minor color updates
- `components/dashboard/Sidebar.tsx` — New active/accent colors
- `components/dashboard/Header.tsx` — New accent colors
- `app/(dashboard)/finances/page.tsx` — Stripe banner color alignment
- `app/(auth)/layout.tsx` — New gradient colors
- `app/(auth)/login/page.tsx` — New button/input focus colors
- `app/(auth)/register/page.tsx` — Same as login
- `app/(admin)/layout.tsx` — Loading state accent color
- `components/admin/AdminSidebar.tsx` — New accent color

### Out of Scope
- Backend/API changes
- New routes or pages
- Stripe subscription billing integration
- Dark mode toggle
- Mobile app changes
- New npm dependencies

---

## Technical Approach

### Architecture Overview

This is a pure frontend visual overhaul. No architecture changes. All modifications are to:
1. Tailwind configuration (design tokens)
2. Component-level Tailwind classes (color swaps)
3. Landing page markup and content restructuring

### Key Technologies
- **Tailwind CSS 3.4**: All styling via utility classes, config-driven tokens
- **Next.js 14 App Router**: Route structure unchanged, Server Components for landing page
- **Lucide React**: Icon library, already installed, no changes needed
- **Google Fonts (Outfit + Inter)**: Outfit for display headings, Inter for body text

### Color Palette Change

**Current:** Orange-based (`primary-600: #ea580c`)

**New:** Emerald/teal-based fitness palette — energetic, clean, professional

```
primary: {
  50:  '#ecfdf5',
  100: '#d1fae5',
  200: '#a7f3d0',
  300: '#6ee7b7',
  400: '#34d399',
  500: '#10b981',  // emerald-500 — main brand
  600: '#059669',  // emerald-600 — primary interactive
  700: '#047857',
  800: '#065f46',
  900: '#064e3b',
  950: '#022c22',
}
accent: {
  400: '#fb923c',  // orange-400 — warm accent for CTAs
  500: '#f97316',  // orange-500
  600: '#ea580c',  // orange-600
}
```

This gives a fresh fitness/health feel while the orange accent maintains energy for CTAs and highlights.

### Files to Modify (Complete List)

| File | Changes |
|------|---------|
| `tailwind.config.ts` | New `primary` + `accent` color scales, Outfit font family |
| `globals.css` | Fix focus-visible to use new primary, Outfit font import adjustments |
| `app/layout.tsx` | Add Outfit font alongside Inter |
| `app/(public)/site/page.tsx` | Complete rewrite with new design, two-flow section, pricing |
| `components/dashboard/Sidebar.tsx` | Replace `primary-*` references with new palette |
| `components/dashboard/Header.tsx` | Replace `primary-*` references |
| `app/(dashboard)/layout.tsx` | Loading spinner color |
| `app/(dashboard)/finances/page.tsx` | Stripe banner gradient, balance card icons |
| `app/(auth)/layout.tsx` | Gradient panel from emerald tones |
| `app/(auth)/login/page.tsx` | Button and input focus colors |
| `app/(auth)/register/page.tsx` | Button and input focus colors |
| `app/(admin)/layout.tsx` | Loading state color |
| `components/admin/AdminSidebar.tsx` | Accent color from amber to emerald-tinted |

### Landing Page Structure (New)

```
Header (sticky, glassmorphism)
├── Logo + Nav links
└── CTA buttons (Entrar / Criar Conta)

Hero Section
├── Badge: "Plataforma #1 para Personal Trainers"
├── H1: Bold headline with gradient text
├── Subtitle
├── Two CTA buttons
└── Social proof stats inline

Two-Flow Explainer Section
├── Section heading: "Como o FitToday Funciona"
├── Flow 1 Card: "Para Voce, Personal Trainer" (SaaS subscription)
│   ├── Icon + visual
│   ├── Description of monthly subscription
│   └── Benefit bullets
├── Flow 2 Card: "Para Seus Alunos" (Marketplace)
│   ├── Icon + visual
│   ├── Description of student payment flow
│   └── Revenue split visual (90% trainer / 10% platform)
└── Connecting visual element

Features Grid (6 cards)

How It Works (3 steps)

Pricing Section (Arrows-style)
├── Section heading
├── Free Plan Card
│   ├── Plan name + price (R$0)
│   ├── Feature checklist
│   └── CTA: "Comece Gratis"
├── Pro Plan Card (highlighted)
│   ├── "Recomendado" badge
│   ├── Plan name + price (R$97/mes)
│   ├── Feature checklist (superset of Free)
│   └── CTA: "Assinar Pro"
└── Commission note: "10% de comissao sobre pagamentos de alunos em ambos os planos"

Trust / Security Section

Final CTA Section

Footer
```

---

## Implementation Considerations

### Design Patterns
- **Color replacement strategy**: Since the current code uses `primary-*` Tailwind classes throughout, changing the `primary` scale in `tailwind.config.ts` will cascade to most components automatically. Only explicit hex colors and non-primary color references (like `indigo-500`, `amber-500`) need manual updating.
- **Progressive enhancement**: Landing page uses CSS animations only (`animate-fade-in-up`), no JS animation libraries.

### Approach: Replace All Matching Properties
For dashboard pages that use `primary-*` extensively, the Tailwind config change handles most color swaps automatically. Pages with hardcoded non-primary colors (finances page `indigo-500`, admin sidebar `amber-500`) need manual edits.

---

## Testing Strategy

### Visual Verification
1. Landing page at `/site` — all sections, mobile + desktop
2. Login/Register at `/login`, `/register` — form states, mobile + desktop
3. Dashboard at `/` — sidebar, header, stat cards
4. Admin at `/admin` — sidebar, header
5. Finances at `/finances` — Stripe banner, balance cards

### Build Verification
- `npx next build --no-lint` must pass with zero errors
- Landing page must remain `○ (Static)` in build output

---

## Success Criteria

- [ ] New color palette applied in `tailwind.config.ts`
- [ ] Landing page redesigned with all required sections
- [ ] Two business flows clearly explained on landing page
- [ ] Free + Pro pricing displayed with feature comparison
- [ ] CMS dashboard visually updated
- [ ] Admin panel accent colors updated
- [ ] Auth screens reflect new brand
- [ ] Focus ring in globals.css matches new primary
- [ ] Build passes successfully
- [ ] All pages remain responsive
