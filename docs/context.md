# Antigravity: Spotify Dashboard & Analytics

## Overview
**Antigravity** is a premium, high-performance web application designed to provide deep insights into Spotify listening habits. It features a modern, "glassmorphism" aesthetic with smooth animations and real-time data integration.

The application allows users to track what they are currently listening to, discover new music via AI-powered playlist generation, analyze their listening patterns through interactive charts, and view a "Wrapped" style yearly retrospective.

---

## Tech Stack
- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) (for animations)
- **Database & Auth**: [Supabase](https://supabase.com/) (Postgres, Auth, RLS)
- **Spotify Integration**: [Spotify Web API](https://developer.spotify.com/documentation/web-api/) via `next-auth`
- **Charts**: [Recharts](https://recharts.org/)
- **Utility**: [Lucide React](https://lucide.dev/) (Icons), `clsx`, `tailwind-merge`

---

## Features Breakdown

### 1. Agora (Now Playing)
- Real-time display of the current track playing on Spotify.
- Visualizers and playback status.
- Recent track history for quick reference.

### 2. Discover
- AI-driven music discovery.
- Interface for generating and managing new playlists based on listening preferences.

### 3. Analytics
- Interactive charts showing listening time, peak hours, and top artists/tracks.
- Aggregated data fetched from Supabase to provide long-term insights.

### 4. History
- Manual import of Spotify streaming history (JSON).
- Scrobbling support to keep the database up-to-date with recent listens.

### 5. Wrapped
- A visually stunning "year-in-review" experience.
- Dynamic cards summarizing top stats: most played artists, tracks, total listening time, and genre breakdowns.
- Instagram-story style export functionality using `html2canvas`.

---

## Data Model (Supabase)

### `spotify_users`
Stores user profile information, Spotify OAuth tokens, and scrobble metadata.
- `id`: Primary key (UUID)
- `spotify_user_id`: Spotify's internal ID
- `access_token` / `refresh_token`: OAuth credentials
- `last_scrobble_at`: Timestamp for the last history sync

### `streaming_history`
Granular record of every track played.
- `ts`: Timestamp of the play
- `ms_played`: Duration in milliseconds
- `track_name`, `artist_name`, `album_name`: Track metadata
- `skipped`: Boolean indicating if the track was skipped

---

## Project Structure
- `src/app/`: Next.js App Router pages and API routes.
- `src/components/`: Reusable UI components and specific dashboard tabs.
- `src/lib/`: Utility functions, Supabase client configuration, and API helpers.
- `docs/`: Project documentation and context.

---

## Development Workflow
1. **Local Dev**: Run `npm run dev` to start the dashboard.
2. **Environment**: Requires `.env.local` with Spotify and Supabase credentials.
3. **Styles**: Uses the design system defined in `tailwind.config.ts` and `src/app/globals.css`.
