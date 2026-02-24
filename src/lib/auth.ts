import { NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { createAdminClient } from "@/lib/supabase";

const scope = [
    "user-read-recently-played",
    "user-top-read",
    "user-library-read",
    "user-read-email",
    "user-read-private",
    "user-read-currently-playing",
    "user-read-playback-state",
    "playlist-modify-private",
    "playlist-modify-public",
].join(" ");

export const authOptions: NextAuthOptions = {
    providers: [
        SpotifyProvider({
            clientId: process.env.SPOTIFY_CLIENT_ID || "",
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET || "",
            authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(scope)}`,
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account && profile) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
                token.expiresAt = account.expires_at;
                token.spotifyUserId = (profile as { id: string }).id;

                // Save refresh token to Supabase for background scrobbling
                try {
                    const admin = createAdminClient();
                    await admin.from("spotify_users").upsert(
                        {
                            spotify_user_id: (profile as { id: string }).id,
                            display_name: (profile as { name?: string }).name ?? null,
                            email: (profile as { email?: string }).email ?? null,
                            image_url:
                                (profile as { image?: string }).image ??
                                (profile as { picture?: string }).picture ??
                                null,
                            refresh_token: account.refresh_token!,
                            access_token: account.access_token!,
                            token_expires_at: account.expires_at
                                ? new Date(account.expires_at * 1000).toISOString()
                                : null,
                        },
                        { onConflict: "spotify_user_id" },
                    );
                } catch (err) {
                    // Non-fatal: scrobbler will get token on next successful login
                    console.error("[auth] Failed to save token to Supabase:", err);
                }
            }
            return token;
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async session({ session, token }: any) {
            session.accessToken = token.accessToken;
            session.spotifyUserId = token.spotifyUserId;
            return session;
        },
    },
    pages: {
        signIn: "/login",
    },
};
