# Physio Helper — Product Requirements Document

## Problem Statement

Senior citizens doing physiotherapy frequently forget how to perform their exercises and struggle to track sets and reps. There is no simple, accessible tool for a physio to assign a plan and for a patient to follow it independently.

## Target Users

| Role | Description |
|---|---|
| **Physio** | Creates and manages exercise plans, monitors patient compliance |
| **Patient** | Senior citizen following a prescribed plan, often with limited tech experience |
| **Caregiver** *(future)* | Family member with read-only access to the patient's plan and history |

## Core User Stories

### Patient
- As a patient, I want to see my exercises clearly so I know what I need to do today
- As a patient, I want step-by-step instructions (and ideally a video) so I don't forget how to do each exercise
- As a patient, I want to track my sets and reps as I go so I don't lose my place
- As a patient, I want to check off my session when done so I feel a sense of completion

### Physio
- As a physio, I want to build a plan for a patient by selecting exercises and setting sets/reps
- As a physio, I want to send my patient a simple link to access their plan without a complex signup
- As a physio, I want to see whether my patients are completing their sessions
- As a physio, I want a library of pre-built exercises so I'm not typing from scratch every time

---

## MVP Feature Scope

### Authentication & Roles
- [ ] Email/password login
- [ ] Magic link onboarding for patients (physio sends link, no account creation required)
- [ ] Two roles: `physio` and `patient`

### Exercise Library (Physio)
- [ ] Pre-built library of ~50–100 common physio exercises with descriptions
- [ ] Physio can create custom exercises (name, ordered instructions, optional image/video)
- [ ] Exercises are reusable across plans

### Plan Management (Physio)
- [ ] Create a plan: add exercises, set sets/reps/hold time, set order, add notes
- [ ] Plan templates for common programs (e.g. "Post knee replacement — Week 1")
- [ ] Assign plan to a patient
- [ ] View patient's session history and compliance

### Exercise Session (Patient)
- [ ] Home screen: large-text cards showing today's exercises
- [ ] Exercise detail: one exercise at a time, numbered steps, optional video
- [ ] Read-aloud instructions via Web Speech API
- [ ] Set counter with prominent "Done — next set" button
- [ ] Session completion screen with positive reinforcement
- [ ] 7-day session history

---

## Post-MVP / Nice-to-Haves

- [ ] Caregiver/family read-only access
- [ ] Pain/difficulty rating per session (1–5 scale + optional note)
- [ ] Compliance summary email to physio (weekly)
- [ ] Clinic/practice accounts (multiple physio seats under one billing relationship)
- [ ] Shareable read-only plan link (no login required)
- [ ] Adjustable font size setting for patient
- [ ] White-labeling for clinics (logo + colors)
- [ ] PDF export of a plan
- [ ] Push notification reminders ("Time for your exercises")
- [ ] Multi-language support
- [ ] Dark mode

---

## Data Models

### `users`
| Field | Type | Notes |
|---|---|---|
| id | uuid | From Supabase auth |
| role | enum | `physio` or `patient` |
| full_name | text | |
| email | text | |
| physio_id | uuid (FK) | Links patient to their physio |

### `exercises`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| created_by | uuid (FK) | Physio who created it; null for pre-built library |
| name | text | |
| description | text | |
| instructions | text[] | Ordered steps |
| image_url | text | Optional |
| video_url | text | Optional |

### `plans`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| physio_id | uuid (FK) | |
| patient_id | uuid (FK) | |
| title | text | |
| notes | text | Optional |
| is_active | boolean | |
| start_date | date | |
| end_date | date | Optional |

### `plan_exercises`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| plan_id | uuid (FK) | |
| exercise_id | uuid (FK) | |
| sets | integer | |
| reps | integer | |
| hold_seconds | integer | Optional, for isometric holds |
| rest_seconds | integer | Optional |
| order_index | integer | Controls display order |
| notes | text | Per-exercise note from physio |

### `sessions`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| plan_id | uuid (FK) | |
| patient_id | uuid (FK) | |
| started_at | timestamp | |
| completed_at | timestamp | Null if incomplete |

### `session_exercise_logs`
| Field | Type | Notes |
|---|---|---|
| id | uuid | |
| session_id | uuid (FK) | |
| plan_exercise_id | uuid (FK) | |
| sets_completed | integer | |
| difficulty_rating | integer | Optional, 1–5 |
| notes | text | Optional patient note |

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Platform | PWA | Works on iPad via Safari, no App Store required, offline support |
| Frontend | React + TypeScript | Mature ecosystem, type safety for health data |
| Styling | Tailwind CSS | Easy to enforce large-text, high-contrast design tokens |
| Backend/DB | Supabase | PostgreSQL + auth + row-level security, minimal ops overhead |
| Hosting | Vercel + Supabase cloud | Both have generous free tiers |

---

## Accessibility Requirements (Non-Negotiable)

- Minimum **20px** base font size; exercise names at **32px+**
- All touch targets minimum **72px** tall
- WCAG AA contrast ratios throughout (4.5:1 for body text)
- No hamburger menus for patients — max 2 taps deep to any action
- Offline support: active plan cached locally, syncs on reconnect
- Plain language: "Bend your knee slowly" not "perform knee flexion"
- Magic link onboarding so patients never create passwords

---

## Build Sequence

1. Supabase project setup — schema + row-level security policies
2. React app scaffold — Tailwind with senior-friendly theme tokens
3. Authentication — login + magic link flow
4. Exercise CRUD — physio creates/manages exercises
5. Plan builder — physio builds and assigns plans
6. Patient home + exercise session flow — the core patient experience
7. Session logging
8. Physio compliance view — patient list, session history
9. Pre-built exercise library — seed data
10. PWA manifest + service worker (offline support)
11. Accessibility audit on real iPad

---

## Success Metrics

- A physio can set up a new patient plan in under **5 minutes**
- A senior patient can complete a session without any assistance
- Patient session completion rate tracked per week
