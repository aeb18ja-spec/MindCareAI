# MindCareAI

Mental health companion app built with Expo (React Native), Supabase, and React Query. Track mood, journal entries, and chat with an AI companion.

## Get started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set your Supabase project values:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   EXPO_PUBLIC_OTP_SERVER_URL=http://YOUR_LOCAL_IP:3001
   ```

   For the OTP server (`server/`), create `server/.env` with:

   ```
   EMAIL_USER=your-sender@gmail.com
   EMAIL_APP_PASSWORD=your-gmail-app-password
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   `SUPABASE_SERVICE_ROLE_KEY` is required so OTP verification can create a pre-confirmed user and avoid a second Supabase confirmation email.

3. **Supabase setup**

   In the [Supabase Dashboard](https://supabase.com/dashboard) SQL Editor, run these scripts in order:

   - `scripts/supabase_profiles.sql` – `profiles` table and RLS
   - `scripts/supabase_moods.sql` – `moods` table and RLS
   - `scripts/supabase_schema.sql` – extends `moods` (stress, activities, date), adds `journals`, `sleep_logs`, `goals` and RLS

   Keep Email auth enabled in Auth settings.

4. **Start the app**

   ```bash
   npx expo start
   ```

   Then open in a development build, Android emulator, iOS simulator, or [Expo Go](https://expo.dev/go).

## Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm start`        | Start Expo dev server          |
| `npm run android`  | Run on Android                 |
| `npm run ios`      | Run on iOS                     |
| `npm run web`      | Run in browser                 |
| `npm run lint`     | Run ESLint                     |
| `npm run reset-project` | Reset to blank app template |

## Project structure

- **`app/`** – File-based routes (Expo Router): tabs (Home, Journal, Chat, Insights, Settings), login, signup.
- **`components/`** – Reusable UI (Header, ScreenLayout, ThemeToggle, etc.).
- **`contexts/`** – Auth, Theme, and Mood/Journal state.
- **`lib/`** – Supabase client and config.
- **`types/`** – Shared types (e.g. mood, journal).

## Learn more

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Supabase for React Native](https://supabase.com/docs/guides/getting-started/quickstarts/react-native)
