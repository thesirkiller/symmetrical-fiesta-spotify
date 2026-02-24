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
    external_urls: {
        spotify: string;
    };
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
    external_urls: {
        spotify: string;
    };
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

export type TimeRange = "short_term" | "medium_term" | "long_term";

export interface AlbumStat {
    id: string;
    name: string;
    artistName: string;
    imageUrl: string;
    trackCount: number;
    estimatedMinutes: number;
}
