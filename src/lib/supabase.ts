import { createClient } from "@supabase/supabase-js";

// These are server-only vars (no NEXT_PUBLIC_ prefix)
// Supabase is only called from API routes / server components
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Public client — safe for client components
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client — server-side only (bypasses RLS)
export function createAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
    }
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}

export type Database = {
    public: {
        Tables: {
            spotify_users: {
                Row: {
                    id: string;
                    spotify_user_id: string;
                    display_name: string | null;
                    email: string | null;
                    image_url: string | null;
                    refresh_token: string;
                    access_token: string | null;
                    token_expires_at: string | null;
                    last_scrobble_at: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["spotify_users"]["Row"], "id" | "created_at" | "updated_at">;
                Update: Partial<Database["public"]["Tables"]["spotify_users"]["Insert"]>;
            };
            streaming_history: {
                Row: {
                    id: string;
                    spotify_user_id: string;
                    ts: string;
                    ms_played: number;
                    track_name: string | null;
                    artist_name: string | null;
                    album_name: string | null;
                    spotify_track_uri: string | null;
                    skipped: boolean;
                    source: string;
                    created_at: string;
                };
                Insert: Omit<Database["public"]["Tables"]["streaming_history"]["Row"], "id" | "created_at">;
                Update: Partial<Database["public"]["Tables"]["streaming_history"]["Insert"]>;
            };
        };
    };
};
