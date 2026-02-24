import {
    SpotifyRecentlyPlayedResponse,
    SpotifyTopArtistsResponse,
    SpotifyTopTracksResponse
} from "@/types/spotify";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export async function getSpotifyData<T>(endpoint: string, accessToken: string): Promise<T> {
    const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
    }

    return response.json();
}

export const spotifyApi = {
    getTopTracks: (accessToken: string, timeRange = "medium_term") =>
        getSpotifyData<SpotifyTopTracksResponse>(`/me/top/tracks?time_range=${timeRange}&limit=50`, accessToken),

    getTopArtists: (accessToken: string, timeRange = "medium_term") =>
        getSpotifyData<SpotifyTopArtistsResponse>(`/me/top/artists?time_range=${timeRange}&limit=50`, accessToken),

    getRecentlyPlayed: (accessToken: string) =>
        getSpotifyData<SpotifyRecentlyPlayedResponse>("/me/player/recently-played?limit=50", accessToken),
};
