# MindCareAI — Project PPT Content

Use this file as a direct script to build your PowerPoint slides.
Recommended length: **10–12 slides** (8–12 minutes).

---

## Slide 1 — Title
**MindCareAI: AI-Powered Mental Wellness Companion**
- Built with Expo (React Native), Supabase, and AI tooling
- Team/Author: _Your name_
- Date: _Presentation date_

**Speaker notes (20–30 sec):**
MindCareAI is a mobile wellness companion that helps users track mood, journal feelings, and receive supportive AI-based guidance. The goal is to make everyday mental wellness tracking simple and actionable.

---

## Slide 2 — Problem Statement
**Why this project?**
- Many people struggle to monitor emotional patterns consistently
- Traditional journaling apps are passive and not personalized
- Users need one place for mood tracking, reflection, and guidance

**Speaker notes (30–40 sec):**
Mental wellness is often reactive. People notice stress only when it becomes overwhelming. We identified a gap for a lightweight, daily-use app that combines tracking with personalized, gentle guidance.

---

## Slide 3 — Solution Overview
**What MindCareAI provides**
- Daily mood check-ins with stress level and activities
- Journal entries with AI-generated supportive reflections
- AI companion chat personalized by recent user context
- Insights dashboard for trends and streaks
- Wellness view combining BMI, sleep, and mood factors

**Speaker notes (35–45 sec):**
Instead of a single feature, MindCareAI integrates the full self-care loop: record, reflect, understand patterns, and act. This encourages consistency and better emotional awareness.

---

## Slide 4 — Core Features
**Feature highlights**
- **Mood Tracker:** mood, stress score, notes, and activity tags
- **Journal:** emotion tags + optional AI insight generation
- **Mood History:** timeline and calendar views
- **Insights:** trend analysis, streaks, stress indicators
- **Wellness:** BMI and sleep-linked wellness recommendations

**Speaker notes (45–60 sec):**
The app supports both quick logging and deeper reflection. Users can check in quickly in a few taps, but they can also dive deeper into journaling and long-term trend analysis.

---

## Slide 5 — User Flow
**End-to-end journey**
1. Sign up with email + OTP verification
2. Complete profile (DOB, height, weight, sleep hours)
3. Daily mood/body/sleep check-in
4. Journal and chat with AI companion
5. Review insights and wellness trends

**Speaker notes (35–45 sec):**
The flow is designed to minimize friction at onboarding, then reinforce daily habits. Insights become more useful as users log more data.

---

## Slide 6 — System Architecture
**High-level architecture**
- **Frontend:** Expo + React Native + Expo Router
- **State/Data fetching:** React Query + Context API
- **Backend/Data:** Supabase (Auth + Postgres + RLS)
- **OTP Service:** Node.js/Express + Nodemailer
- **AI Layer:** Rork AI toolkit for chat and journal insights

**Speaker notes (45–60 sec):**
The architecture keeps client experience fast while using Supabase as the source of truth. A separate OTP service handles verification email delivery and secure account creation flow.

---

## Slide 7 — Data Model & Security
**Key tables**
- `profiles`
- `moods` (mood, stress, activities, date)
- `journals` (content, emotions, AI insights)
- `sleep_logs`
- `goals`

**Security controls**
- Supabase authentication
- Row Level Security (RLS) per user
- Environment-based secret handling
- OTP expiry and server-side verification

**Speaker notes (45–60 sec):**
User privacy is central. Every wellness record is scoped to the authenticated user through RLS policies, and OTP tokens are short-lived to reduce abuse risk.

---

## Slide 8 — AI Personalization Approach
**How AI is used safely and meaningfully**
- Chat system prompt includes recent moods, stress, streak, and journal context
- Journal insight generation gives short, supportive reflections
- AI is positioned as supportive coach, not medical diagnosis

**Speaker notes (40–50 sec):**
We designed prompts to be empathetic and context-aware. The assistant references recent patterns to avoid generic responses and keeps guidance practical and non-clinical.

---

## Slide 9 — Challenges & Fixes
**Main engineering challenges**
- OTP signup + confirmation edge cases
- Preventing account duplication and signup loops
- Keeping profile completeness logic consistent
- Maintaining responsive UX across web/mobile

**Fixes implemented**
- Server endpoint to verify OTP and create pre-confirmed user
- Fallback flow handling when service role key is missing
- Profile upsert and completion checks in auth lifecycle

**Speaker notes (50–65 sec):**
The hardest part was balancing security with smooth onboarding. We improved this by centralizing verification logic server-side and adding robust fallback/error handling.

---

## Slide 10 — Demo Plan
**What to show live (3–4 minutes)**
- Login/signup + OTP verification
- Add a mood check-in with stress + activity
- Create journal entry and show AI insight
- Open Insights and Wellness pages
- Ask AI companion a stress-related prompt

**Speaker notes (30–40 sec):**
This sequence demonstrates complete value: onboarding, data entry, intelligent feedback, and analytics in one user journey.

---

## Slide 11 — Impact & Future Scope
**Current impact**
- Encourages daily self-awareness and consistency
- Combines emotional and physical wellness context
- Makes reflection actionable with AI guidance

**Future enhancements**
- Push reminders and habit nudges
- Clinician/export-friendly reports
- Advanced trend forecasting
- Optional multilingual support

**Speaker notes (35–45 sec):**
MindCareAI already delivers practical daily wellness support. Next iterations can focus on retention features, deeper analytics, and wider accessibility.

---

## Slide 12 — Closing
**Thank You**
- MindCareAI: from tracking to understanding to action
- Questions?

**Speaker notes (15–20 sec):**
MindCareAI demonstrates how thoughtful AI + clean product design can improve everyday mental wellness habits responsibly.

---

## Optional Backup Slide — Tech Stack Snapshot
- Expo 54, React Native 0.81, React 19
- Supabase JS v2
- React Query v5
- NativeWind + Tailwind setup
- Node/Express OTP server

---

## Design Tips for Your PPT
- Keep a purple/indigo gradient theme consistent with app branding
- Use screenshots for: Home, Journal, Chat, Insights, Wellness
- Limit text to 4–6 bullets per slide
- Add one architecture diagram and one user-flow diagram
- Aim for ~45 seconds per content-heavy slide
