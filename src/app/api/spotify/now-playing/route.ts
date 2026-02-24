import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { spotifyApi } from "@/lib/spotify";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = (session as { accessToken?: string }).accessToken;
    if (!token) {
        return NextResponse.json({ error: "No access token" }, { status: 401 });
    }

    try {
        const data = await spotifyApi.getCurrentlyPlaying(token);
        return NextResponse.json(data ?? { is_playing: false, item: null });
    } catch {
        return NextResponse.json({ is_playing: false, item: null });
    }
}
