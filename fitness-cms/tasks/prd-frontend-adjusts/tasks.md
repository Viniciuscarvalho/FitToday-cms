# Tasks: FitToday Frontend Design System Overhaul

<critical>Read the prd.md and techspec.md files in this folder before executing any task.</critical>

---

## Task 1.0: Update Design Tokens (S)

### Objective
Update Tailwind config and global CSS to establish the new fitness-oriented color palette and typography.

### Subtasks
- [ ] 1.1 Update `tailwind.config.ts` — replace `primary` color scale with emerald/teal palette, add `accent` orange scale, register Outfit font family
- [ ] 1.2 Update `globals.css` — fix `*:focus-visible` to use new primary color, ensure animation classes preserved
- [ ] 1.3 Update `app/layout.tsx` — add Outfit font import alongside Inter

### Success Criteria
- `tailwind.config.ts` has new `primary` (emerald) and `accent` (orange) color scales
- `globals.css` focus ring uses new primary color
- Outfit font available globally via CSS class

### Relevant Files
- `web-cms/tailwind.config.ts`
- `web-cms/app/globals.css`
- `web-cms/app/layout.tsx`

### Dependencies
None — this is the foundation task.

**status: pending**

---

## Task 2.0: Redesign Landing Page (L)

### Objective
Complete rewrite of the landing page with premium fitness aesthetics, clear two-flow business explanation, and Arrows-style Free/Pro pricing.

### Subtasks
- [ ] 2.1 Rewrite hero section — bold headline with emerald gradient text, social proof badges, dual CTAs
- [ ] 2.2 Add two-flow explainer section — side-by-side cards explaining SaaS subscription (trainer) and marketplace payments (student)
- [ ] 2.3 Update features grid — 6 feature cards with new color scheme
- [ ] 2.4 Update how-it-works section — 3 steps with new palette
- [ ] 2.5 Build Arrows-style pricing section — Free plan card + highlighted Pro plan card (R$97/mes) with feature checklists and commission note
- [ ] 2.6 Update trust/security section with new palette
- [ ] 2.7 Update CTA section and footer
- [ ] 2.8 Ensure full mobile responsiveness

### Success Criteria
- Landing page renders all sections with new design system
- Two business flows clearly explained
- Free and Pro plans displayed with feature comparison
- Page remains statically generated (Server Component)
- Fully responsive (mobile, tablet, desktop)

### Relevant Files
- `web-cms/app/(public)/site/page.tsx`

### Dependencies
Task 1.0 (design tokens must be in place)

**status: pending**

---

## Task 3.0: Update CMS Dashboard Components (M)

### Objective
Refresh the trainer CMS dashboard sidebar, header, and key pages to use the new design system.

### Subtasks
- [ ] 3.1 Update `Sidebar.tsx` — active state colors from `primary-*` (auto-handled by config change), verify visual correctness
- [ ] 3.2 Update `Header.tsx` — button and focus state colors, verify
- [ ] 3.3 Update `app/(dashboard)/layout.tsx` — loading spinner color
- [ ] 3.4 Update `finances/page.tsx` — replace `indigo-500 to purple-600` Stripe banner with new primary gradient, update balance card icon colors

### Success Criteria
- Sidebar active state uses new emerald primary
- Header CTA button uses new primary
- Finances page Stripe banner consistent with brand
- No functional changes

### Relevant Files
- `web-cms/components/dashboard/Sidebar.tsx`
- `web-cms/components/dashboard/Header.tsx`
- `web-cms/app/(dashboard)/layout.tsx`
- `web-cms/app/(dashboard)/finances/page.tsx`

### Dependencies
Task 1.0

**status: pending**

---

## Task 4.0: Update Auth Screens (S)

### Objective
Refresh login, register, and auth layout to reflect the new brand identity.

### Subtasks
- [ ] 4.1 Update `app/(auth)/layout.tsx` — gradient panel from emerald tones instead of orange
- [ ] 4.2 Update `app/(auth)/login/page.tsx` — button colors, input focus colors (most via `primary-*` auto-cascade)
- [ ] 4.3 Update `app/(auth)/register/page.tsx` — same as login

### Success Criteria
- Auth branding panel uses new emerald gradient
- Form buttons and focus states use new primary
- Mobile logo icon uses new primary color

### Relevant Files
- `web-cms/app/(auth)/layout.tsx`
- `web-cms/app/(auth)/login/page.tsx`
- `web-cms/app/(auth)/register/page.tsx`

### Dependencies
Task 1.0

**status: pending**

---

## Task 5.0: Update Admin Panel (S)

### Objective
Refresh the admin panel sidebar and layout accent colors to align with the new design system.

### Subtasks
- [ ] 5.1 Update `AdminSidebar.tsx` — replace `amber-500` accent with new emerald-tinted accent (e.g., `emerald-400` or `primary-400`)
- [ ] 5.2 Update `app/(admin)/layout.tsx` — loading spinner color

### Success Criteria
- Admin sidebar active states use new accent color
- Admin loading states use new accent color
- Dark theme maintained for admin (only accent changes)

### Relevant Files
- `web-cms/components/admin/AdminSidebar.tsx`
- `web-cms/app/(admin)/layout.tsx`

### Dependencies
Task 1.0

**status: pending**

---

## Task 6.0: Build Verification (S)

### Objective
Verify the entire project builds successfully with all changes applied.

### Subtasks
- [ ] 6.1 Run `npx next build --no-lint` — must pass with zero errors
- [ ] 6.2 Verify `/site` remains `○ (Static)` in build output
- [ ] 6.3 Fix any build errors that arise

### Success Criteria
- Build passes with zero errors
- Landing page is statically generated
- No new warnings introduced

### Dependencies
Tasks 1.0 through 5.0

**status: pending**
