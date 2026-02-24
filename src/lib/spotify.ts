import type {
    SpotifyTopTracksResponse,
    SpotifyTopArtistsResponse,
    SpotifyRecentlyPlayedResponse,
    SpotifyCurrentlyPlaying,
    SpotifyRecommendationsResponse,
    SpotifyUser,
} from "@/types/spotify";

const BASE = "https://api.spotify.com/v1";

async function spotifyFetch<T>(
    endpoint: string,
    accessToken: string,
    options?: RequestInit,
): Promise<T> {
    const res = await fetch(`${BASE}${endpoint}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            ...options?.headers,
        },
    });

    if (res.status === 204) return null as T;
    if (!res.ok) {
        const err = await res.text().catch(() => res.statusText);
        throw new Error(`Spotify API ${res.status}: ${err}`);
    }
    return res.json() as Promise<T>;
}

export const spotifyApi = {
    // ── Read endpoints ──────────────────────────────────────────────────────
    getMe: (token: string) =>
        spotifyFetch<SpotifyUser>("/me", token),

    getTopTracks: (token: string, timeRange = "medium_term", limit = 50) =>
        spotifyFetch<SpotifyTopTracksResponse>(
            `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
            token,
        ),

    getTopArtists: (token: string, timeRange = "medium_term", limit = 50) =>
        spotifyFetch<SpotifyTopArtistsResponse>(
            `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
            token,
        ),

    getRecentlyPlayed: (token: string, limit = 50) =>
        spotifyFetch<SpotifyRecentlyPlayedResponse>(
            `/me/player/recently-played?limit=${limit}`,
            token,
        ),

    getCurrentlyPlaying: (token: string) =>
        spotifyFetch<SpotifyCurrentlyPlaying | null>(
            "/me/player/currently-playing",
            token,
        ),

    getRecommendations: (
        token: string,
        seedTracks: string[],
        seedArtists: string[],
        limit = 20,
    ) =>
        spotifyFetch<SpotifyRecommendationsResponse>(
            `/recommendations?seed_tracks=${seedTracks.slice(0, 3).join(",")}&seed_artists=${seedArtists.slice(0, 2).join(",")}&limit=${limit}&min_popularity=30`,
            token,
        ),

    // ── Write endpoints ─────────────────────────────────────────────────────
    createPlaylist: async (
        token: string,
        userId: string,
        name: string,
        description: string,
    ) =>
        spotifyFetch<{ id: string; external_urls: { spotify: string } }>(
            `/users/${userId}/playlists`,
            token,
            {
                method: "POST",
                body: JSON.stringify({ name, description, public: false }),
            },
        ),

    addTracksToPlaylist: (
        token: string,
        playlistId: string,
        uris: string[],
    ) =>
        spotifyFetch<{ snapshot_id: string }>(
            `/playlists/${playlistId}/tracks`,
            token,
            {
                method: "POST",
                body: JSON.stringify({ uris }),
            },
        ),
};

// ── Token refresh (server-side) ─────────────────────────────────────────────
export async function refreshAccessToken(
    refreshToken: string,
): Promise<{ access_token: string; expires_in: number } | null> {
    try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${Buffer.from(
                    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
                ).toString("base64")}`,
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}
