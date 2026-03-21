# PRD: Dogfood Bug Fixes

## Overview

Fix 5 issues found during dogfood QA session on 2026-03-21. Issues span registration form validation, image performance, routing, page titles, and login error UX.

## Goals

- Eliminate silent failures in the registration flow
- Fix Next.js image performance warnings
- Prevent 404 on common URL patterns
- Improve page titles for SEO and UX
- Make auth errors visually clear

## Issues (High → Low)

### ISSUE-001 (High): Register form silently clears fields on password mismatch

- **Problem**: Form submits to Firebase even when passwords don't match, receives 400, then clears all fields without showing any error
- **Fix**: Add client-side validation before submission; show "As senhas não coincidem" inline error; prevent Firebase call when passwords differ

### ISSUE-002 (Medium): Next.js `<Image>` with `fill` missing `sizes` prop

- **Problem**: Two Unsplash images on the landing page use `fill` layout without `sizes`, causing console warnings and poor responsive image loading
- **Fix**: Add appropriate `sizes` prop to both images

### ISSUE-005 (Medium): `/dashboard` returns 404 instead of redirecting to `/cms`

- **Problem**: Users navigating to `/dashboard` hit a 404. Also the 404 page's "Página Inicial" links to `/site` instead of `/`
- **Fix**: Add redirect from `/dashboard` → `/cms` in Next.js config or middleware; fix the `/site` link to `/`

### ISSUE-003 (Low): Generic `<title>` on login and register pages

- **Problem**: Both `/login` and `/register` show "FitToday CMS - Personal Trainer Dashboard" in the browser tab
- **Fix**: Set page-specific metadata titles

### ISSUE-004 (Low): Login error "Email ou senha incorretos" lacks visual styling

- **Problem**: Error appears as plain text above the email field with no error box, border, or icon
- **Fix**: Style the error with a red alert box or equivalent visual treatment

## Success Criteria

- Password mismatch on register shows error inline, no Firebase call made
- No console warnings about `sizes` prop on any page
- `/dashboard` redirects to `/cms` (or login with redirect param if unauthenticated)
- Login and register pages have distinct, appropriate `<title>` values
- Login error state is visually prominent
