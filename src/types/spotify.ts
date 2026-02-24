export interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

export interface SpotifyArtist {
    id: string;
    name: string;
    images?: SpotifyImage[];
    genres?: string[];
    popularity?: number;
    followers?: { total: number };
    external_urls: { spotify: string };
}

export interface SpotifyTrack {
    id: string;
    name: string;
    artists: SpotifyArtist[];
    album: {
        id: string;
        name: string;
        images: SpotifyImage[];
        release_date: string;
    };
    duration_ms: number;
    popularity?: number;
    uri: string;
    external_urls: { spotify: string };
    preview_url: string | null;
}

export interface SpotifyTopTracksResponse {
    items: SpotifyTrack[];
}

export interface SpotifyTopArtistsResponse {
    items: SpotifyArtist[];
}

export interface SpotifyRecentlyPlayedResponse {
    items: {
        track: SpotifyTrack;
        played_at: string;
    }[];
}

export interface SpotifyCurrentlyPlaying {
    is_playing: boolean;
    progress_ms: number | null;
    item: SpotifyTrack | null;
    currently_playing_type: string;
    timestamp: number;
}

export interface SpotifyRecommendationsResponse {
    tracks: SpotifyTrack[];
    seeds: {
        id: string;
        type: string;
        href: string;
    }[];
}

export interface SpotifyUser {
    id: string;
    display_name: string;
    email: string;
    images: SpotifyImage[];
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    external_urls: { spotify: string };
    tracks: { total: number };
}

// Format of Spotify's extended streaming history export JSON
export interface SpotifyHistoryEntry {
    ts: string;                                        // ISO timestamp
    ms_played: number;                                 // milliseconds played
    master_metadata_track_name: string | null;
    master_metadata_album_artist_name: string | null;
    master_metadata_album_album_name: string | null;
    spotify_track_uri: string | null;
    reason_end: string | null;
    skipped: boolean | null;
}

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface AlbumStat {
    id: string;
    name: string;
    artistName: string;
    imageUrl: string;
    trackCount: number;
    estimatedMinutes: number;
}
