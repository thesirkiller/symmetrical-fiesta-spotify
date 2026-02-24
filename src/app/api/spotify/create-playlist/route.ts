import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyApi } from "@/lib/spotify";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (session as { accessToken?: string }).accessToken;
    const userId = (session as { spotifyUserId?: string }).spotifyUserId;
    if (!token || !userId) {
        return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    try {
        const { trackUris, name } = await req.json() as {
            trackUris: string[];
            name?: string;
        };

        if (!trackUris?.length) {
            return NextResponse.json({ error: "No tracks provided" }, { status: 400 });
        }

        const playlistName = name ?? `Antigravity Picks — ${new Date().toLocaleDateString("pt-BR")}`;

        // 1. Create the playlist
        const playlist = await spotifyApi.createPlaylist(
            token,
            userId,
            playlistName,
            "Gerado pelo Antigravity Spotify com base nos seus gostos recentes 🎵",
        );

        // 2. Add tracks (max 100 at a time)
        const chunks = [];
        for (let i = 0; i < trackUris.length; i += 100) {
            chunks.push(trackUris.slice(i, i + 100));
        }
        for (const chunk of chunks) {
            await spotifyApi.addTracksToPlaylist(token, playlist.id, chunk);
        }

        return NextResponse.json({
            id: playlist.id,
            url: playlist.external_urls.spotify,
            name: playlistName,
        });
    } catch (err) {
        console.error("[create-playlist] Error:", err);
        return NextResponse.json({ error: "Failed to create playlist" }, { status: 500 });
    }
}
