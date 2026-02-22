# Product Requirements Document (PRD)

**Project Name:** FitToday Frontend Design System Overhaul
**Document Version:** 1.0
**Date:** 2026-02-22
**Author:** Vinicius Carvalho
**Status:** Draft

---

## Executive Summary

**Problem Statement:**
The FitToday platform lacks a unified visual identity across its three areas (landing page, CMS dashboard, admin panel). The landing page doesn't clearly communicate the two distinct business flows (SaaS subscription for trainers + marketplace for student payments). The pricing section doesn't show a free tier or adequately sell the Pro plan. The overall design needs to feel premium, fitness-oriented, and conversion-focused.

**Proposed Solution:**
Complete frontend design overhaul establishing a cohesive fitness-oriented design system with clear light colors, applied consistently across the landing page, CMS dashboard, admin panel, and auth screens. The landing page will clearly communicate both revenue flows with an attractive pricing section inspired by modern SaaS patterns (Lattice/Arrows style).

**Business Value:**
- Increase trainer sign-up conversion with clearer value proposition
- Increase Pro plan subscription rate with better pricing UX
- Build brand trust with consistent, professional design across all touchpoints
- Meet Stripe business site requirements with a polished commercial presence

---

## Project Overview

### Current State
- Landing page exists at `/site` with dark hero, features, pricing, and trust sections
- CMS dashboard uses orange (`primary-600: #ea580c`) as primary color throughout
- Admin panel uses a separate dark theme with amber accents
- Auth screens use orange gradient branding panel
- No unified typography system (Outfit on landing, Inter default elsewhere)
- Pricing section shows only a single 10% commission model — no SaaS subscription tiers
- Focus ring in globals.css uses green (#16a34a), mismatched with primary palette

### Desired State
- Unified fitness-oriented design system with fresh, energetic colors
- Landing page with premium aesthetics, clear two-flow explanation, and conversion-optimized pricing
- CMS dashboard and admin panel visually aligned with the same design system
- Auth screens reflecting the updated brand identity
- Free tier + Pro plan pricing clearly presented
- Consistent typography, spacing, and component patterns across all areas

---

## User Personas

### Primary Persona: Personal Trainer (Prospective)
**Goals:**
- Understand what FitToday offers within seconds of landing
- See clear pricing — what's free vs. paid
- Sign up quickly and start managing clients

**Pain Points:**
- Confused by platforms that don't explain their pricing model clearly
- Distrusts platforms that look unpolished or generic

### Secondary Persona: Platform Administrator
**Goals:**
- Manage trainers efficiently with a professional admin interface
- Monitor platform health and revenue

### Tertiary Persona: Student/Client
**Goals:**
- Trust the platform when making payments for training programs
- Understand they're paying the trainer, not the platform

---

## Functional Requirements

### FR-001: Unified Design System [MUST]

**Description:**
Establish a new color palette, typography, and component patterns that work across all areas. Colors should be light, clean, and fitness-oriented (think energetic but professional — teal/emerald greens, clean whites, with accent pops).

**Acceptance Criteria:**
- New primary color palette defined in `tailwind.config.ts` — shifting from orange to a fitness-oriented palette (emerald/teal primary with energetic accents)
- `globals.css` focus ring updated to match new primary color
- Outfit font applied globally (not just landing page)
- Consistent border-radius, shadow, and spacing tokens

---

### FR-002: Landing Page Redesign [MUST]

**Description:**
Redesign the landing page with Lattice-style aesthetics: clean gradients, strong typography hierarchy, social proof, and clear CTAs. Must clearly explain the two business flows.

**Sections required:**
1. **Hero** — Bold headline, subtitle explaining the platform, primary CTA, social proof badges
2. **Two-Flow Explainer** — Visual section explaining:
   - Flow 1: Trainer subscribes to FitToday (SaaS model, R$97/mês Pro)
   - Flow 2: Student pays trainer (marketplace, 10% commission)
3. **Features Grid** — 6 feature cards with icons
4. **How It Works** — 3-step visual flow
5. **Pricing** — Arrows-style pricing with:
   - Free plan (limited features)
   - Pro plan R$97/mês (full features)
   - Clear feature comparison
   - Highlighted recommended plan
   - Trust badges (Stripe, SSL, etc.)
6. **Social Proof / Trust** — Security, Stripe partnership
7. **Final CTA** — Strong call to action
8. **Footer** — Links, contact, legal

**Acceptance Criteria:**
- Page loads without authentication
- All sections render correctly on mobile, tablet, desktop
- Two business flows clearly explained with visual hierarchy
- Pricing shows Free and Pro tiers with feature comparison
- "Comece Gratuitamente" CTA is prominent

---

### FR-003: Pricing Section (Arrows-style) [MUST]

**Description:**
Pricing section inspired by Arrows Pricing Page V2: side-by-side plan cards, feature checklist comparison, highlighted recommended plan, toggle for monthly/annual (future), trust elements.

**Plans to display:**

**Free Plan:**
- Up to 5 active students
- Up to 3 programs
- Basic exercise library
- Basic analytics
- 10% commission on student payments

**Pro Plan — R$97/mês:**
- Unlimited students
- Unlimited programs
- Full exercise library with video
- Advanced analytics
- Priority messaging
- Customizable branding
- 10% commission on student payments
- Priority support

**Acceptance Criteria:**
- Two plan cards displayed side by side (stacked on mobile)
- Pro plan visually highlighted as recommended
- Feature checklist with check/x marks for each plan
- CTA buttons on each card ("Comece Gratis" / "Assinar Pro")
- Commission info clearly shown on both plans

---

### FR-004: CMS Dashboard Visual Refresh [MUST]

**Description:**
Update the trainer CMS dashboard (sidebar, header, all pages) to use the new design system colors and patterns while preserving all existing functionality.

**Acceptance Criteria:**
- Sidebar uses new primary color for active states
- Header uses new color scheme
- All card backgrounds, badges, and interactive elements updated
- Finances page Stripe banner aligned with new palette (remove indigo/purple outlier)
- No functional changes — purely visual

---

### FR-005: Admin Panel Visual Refresh [SHOULD]

**Description:**
Update the admin panel to use a professional dark theme that aligns with the new design system. Replace amber accents with the new accent color.

**Acceptance Criteria:**
- Admin sidebar accent color updated to new system
- Loading states use new accent color
- Visual consistency with the overall brand

---

### FR-006: Auth Screens Visual Refresh [MUST]

**Description:**
Update login, register, and pending-approval screens to reflect the new brand identity.

**Acceptance Criteria:**
- Branding panel gradient uses new primary colors
- Form input focus states match new primary
- Button colors updated
- Stats on branding panel remain

---

## Non-Functional Requirements

### NFR-001: Performance [MUST]
- Landing page must remain statically generated (no "use client" at page level)
- No new heavy dependencies (no Framer Motion, no animation libraries)
- Use CSS animations only (already have `animate-fade-in-up`)

### NFR-002: Responsiveness [MUST]
- All changes must be fully responsive (mobile-first)
- Pricing cards stack on mobile, side-by-side on desktop

### NFR-003: Accessibility [SHOULD]
- Color contrast ratios meet WCAG AA standards
- Focus rings visible and consistent

---

## Out of Scope

1. **Backend changes** — No API modifications
2. **New pages/routes** — No new routes beyond existing structure
3. **Dark mode** — Not implementing dark mode toggle
4. **Monthly/Annual pricing toggle** — Future feature, not for this iteration
5. **Stripe Subscriptions integration for Pro plan** — Backend billing for the SaaS subscription is a separate feature; this PRD covers only the frontend presentation
6. **Mobile app changes** — iOS/Android apps are not in scope

---

## Release Planning

### Single Phase: Design System Overhaul
1. Update `tailwind.config.ts` with new color palette
2. Update `globals.css` with corrected focus ring and global styles
3. Redesign landing page with all new sections
4. Update CMS dashboard components (Sidebar, Header)
5. Update auth layout and screens
6. Update admin sidebar and layout
7. Update dashboard pages (finances, etc.) to use new colors
8. Build verification

---

## Design References

- **Landing page style:** Lattice Landing Page V2 (SaaSpo) — clean gradients, strong typography, premium feel
- **Pricing style:** Arrows Pricing Page V2 (SaaSpo) — side-by-side cards, feature comparison, highlighted recommended
- **Color direction:** Fitness-oriented, light/clean — think emerald/teal primary with warm accents, white/gray-50 backgrounds
- **Typography:** Outfit for headings (already on landing), Inter for body (already global)
