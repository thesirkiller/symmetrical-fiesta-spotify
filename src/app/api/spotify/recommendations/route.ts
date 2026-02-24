import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyApi } from "@/lib/spotify";

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (session as { accessToken?: string }).accessToken;
    if (!token) {
        return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    // Accept optional seed overrides via query params
    const { searchParams } = new URL(req.url);
    const seedTracksParam = searchParams.get("seed_tracks");
    const seedArtistsParam = searchParams.get("seed_artists");

    try {
        let seedTracks: string[] = [];
        let seedArtists: string[] = [];

        if (seedTracksParam && seedArtistsParam) {
            seedTracks = seedTracksParam.split(",");
            seedArtists = seedArtistsParam.split(",");
        } else {
            // Auto-derive seeds from top tracks/artists
            const [tracks, artists] = await Promise.all([
                spotifyApi.getTopTracks(token, "short_term", 10),
                spotifyApi.getTopArtists(token, "short_term", 5),
            ]);
            seedTracks = tracks.items.slice(0, 3).map((t) => t.id);
            seedArtists = artists.items.slice(0, 2).map((a) => a.id);
        }

        const recommendations = await spotifyApi.getRecommendations(
            token,
            seedTracks,
            seedArtists,
            20,
        );

        return NextResponse.json(recommendations);
    } catch (err) {
        console.error("[recommendations] Error:", err);
        return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
    }
}
