# PRD: FitToday CMS

## Overview

FitToday CMS is a web-based content management system that enables personal trainers to create, manage, and sell workout programs. The platform serves as a marketplace connecting trainers with students through a mobile app (iOS).

## Problem Statement

Personal trainers need a professional platform to:
- Create and structure workout programs with detailed exercises
- Manage their student base and track progress
- Monetize their expertise through subscription-based programs
- Build their brand and reach more clients

## Target Users

1. **Personal Trainers**: Fitness professionals who create and sell workout programs
2. **Gym Owners**: Managing multiple trainers and their programs
3. **Fitness Content Creators**: Building courses and programs at scale

## Core Features

### Phase 1: Foundation (MVP)

#### 1.1 Authentication & Onboarding
- [x] Email/Password authentication
- [x] Google Sign-In
- [x] Apple Sign-In
- [ ] Trainer onboarding flow (profile setup, Stripe Connect)
- [ ] Role-based access (student → trainer upgrade)

#### 1.2 Program Management
- [x] Program listing page
- [x] Program builder (basic structure)
- [ ] Complete program CRUD with:
  - Program details (title, description, price, duration)
  - Week structure management
  - Workout days configuration
  - Exercise assignment with sets/reps/rest
- [ ] Program publishing/unpublishing
- [ ] Program duplication
- [ ] Program preview

#### 1.3 Exercise Library
- [ ] Pre-built exercise database
- [ ] Custom exercise creation
- [ ] Exercise categories/muscle groups
- [ ] Video/image attachments for exercises
- [ ] Exercise search and filtering

#### 1.4 Dashboard
- [x] Basic dashboard layout
- [ ] Revenue overview (daily/weekly/monthly)
- [ ] Student count and growth metrics
- [ ] Recent activity feed
- [ ] Quick actions panel

### Phase 2: Student Management

#### 2.1 Student List
- [ ] View all enrolled students
- [ ] Student search and filtering
- [ ] Student profile view
- [ ] Subscription status tracking

#### 2.2 Progress Tracking
- [ ] View student workout completions
- [ ] Progress photos (if shared)
- [ ] Check-in history
- [ ] Notes and communication

### Phase 3: Financial & Settings

#### 3.1 Financial Dashboard
- [ ] Stripe Connect integration status
- [ ] Earnings breakdown by program
- [ ] Payout history
- [ ] Subscription management

#### 3.2 Trainer Settings
- [ ] Profile management (bio, photo, certifications)
- [ ] Notification preferences
- [ ] Account settings
- [ ] Public profile preview

### Phase 4: Advanced Features

#### 4.1 Analytics
- [ ] Detailed program performance
- [ ] Student engagement metrics
- [ ] Revenue forecasting
- [ ] Churn analysis

#### 4.2 Marketing Tools
- [ ] Discount codes/promotions
- [ ] Referral program
- [ ] Email campaigns
- [ ] Social media integrations

## Technical Requirements

### Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Storage, Functions)
- **Payments**: Stripe Connect
- **Hosting**: Vercel (CMS) + Firebase (Backend)

### Non-Functional Requirements
- Mobile-responsive design
- Portuguese (BR) as primary language
- LGPD compliance
- Sub-3s page load times

## Success Metrics

1. **Trainer Adoption**: 100 active trainers in first 6 months
2. **Program Creation**: Average 3 programs per trainer
3. **Revenue**: R$50k GMV in first year
4. **Retention**: 70% trainer retention after 3 months

## Timeline

- Phase 1 (MVP): 4 weeks
- Phase 2: 2 weeks
- Phase 3: 2 weeks
- Phase 4: 4 weeks

## Dependencies

- Firebase project configured: `fittoday-2aaff` ✅
- Stripe account with Connect enabled
- Apple Developer account for Sign-In
- Google Cloud project for OAuth
