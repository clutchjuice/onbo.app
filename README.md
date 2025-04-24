# onbo.app

# OnboardingFlow – Product Requirements

## Overview
A no-code SaaS app to let users build and share custom onboarding workflows via drag-and-drop builder. Users invite participants and track their progress.

---

## Key Personas
- **Agency owners**: Onboard clients
- **HR teams**: Onboard new hires
- **Coaches/course creators**: Onboard students

---

## Core Features

### Must-Have (MVP)
- 🔐 Auth via **Supabase Auth** (email/password + magic link + org support)
- 🧱 Organization creation & multi-user roles
- 🛠 Workflow Builder (drag and drop steps: form, video, text, contract)
- 🔗 Shareable onboarding links
- 📩 Invite participants via name/email
- 📊 Participant CRM with tracking (status, data, progress)
- 📈 Analytics: completions, avg. time, per-step time
- 📂 Template Library (preset templates + AI-generated)
- ⚙️ Workflow settings

---

### Out of Scope (Phase 1)
- Conditional logic between steps
- Payment step
- Webhooks & API integrations
- CRM 3rd-party sync

---

## Screens

### 1. Login/Register
- Auth via **Supabase Auth**
- Email/password login, magic link login
- Supports switching between orgs (multi-tenancy)
- Minimal UI

### 2. Dashboard
- Shows workflows the user has access to
- Ability to create a new workflow
- Access to template gallery

### 3. Workflow Builder
- Drag-and-drop UI to add/edit/reorder steps
- Uses `@dnd-kit/core` for drag and drop
- Side panel to configure each step
- Save + Publish button
- Preview link generator

### 4. Workflow Settings
- Title, slug, branding (logo, colors)
- Organization access control
- Archive/Delete workflow

### 5. Invite Participants
- Manually invite by name + email
- Generate invite link with token
- Track pending invites

### 6. Public Onboarding Page (`/onboarding/:token`)
- Minimal UI for participant
- Shows each step in sequence
- Auto-progress on complete
- Tracks progress via invite token

### 7. CRM (Participant Tracker)
- List of participants for a workflow
- Columns: name, email, status, started_at, completed_at
- View per-participant step progress

### 8. Analytics Dashboard
- Visual summary of completions, time spent
- Per-step analytics
- Export CSV option (optional)

### 9. Template Library
- Select from base templates
- Use AI to generate from a description prompt
- Import template into builder

---

## Tech Stack

### Frontend
- Next.js (App Router)
- TailwindCSS
- shadcn/ui
- Zustand (or React Context)
- **@dnd-kit/core** (drag-and-drop)

### Backend
- Supabase (DB + Storage + **Auth** + RLS)
- Supabase Edge Functions (email sending)
- OpenAI (for AI workflow templates)

### Tooling
- Zod (validation)
- Prisma or Supabase SDK for DB access
- Vercel (deploy)

---

## Navigation Structure

| Route | Description |
|-------|-------------|
| `/login` | Auth |
| `/register` | Auth |
| `/dashboard` | Workflow list |
| `/workflows/new` | Create new workflow |
| `/workflows/:id` | Workflow builder |
| `/workflows/:id/settings` | Settings panel |
| `/workflows/:id/crm` | Participant progress + data |
| `/workflows/:id/analytics` | Analytics dashboard |
| `/templates` | Base templates |
| `/onboarding/:token` | Public participant view |

---

## AI Prompt Output Spec

```json
{
  "title": "New Client Onboarding",
  "steps": [
    { "type": "text", "title": "Welcome", "content": "Welcome to our onboarding!" },
    { "type": "video", "title": "Intro Video", "url": "https://..." },
    { "type": "form", "title": "Client Intake", "fields": [...] },
    { "type": "contract", "title": "Sign Agreement", "contractId": "abc123" }
  ]
}
