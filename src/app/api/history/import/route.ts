import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";
import type { SpotifyHistoryEntry } from "@/types/spotify";

const BATCH_SIZE = 500;
const MIN_MS_PLAYED = 30_000; // ignore plays < 30 seconds

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as { spotifyUserId?: string }).spotifyUserId;
    if (!userId) {
        return NextResponse.json({ error: "No Spotify user ID" }, { status: 401 });
    }

    try {
        const { entries }: { entries: SpotifyHistoryEntry[] } = await req.json();

        if (!Array.isArray(entries) || entries.length === 0) {
            return NextResponse.json({ error: "No entries provided" }, { status: 400 });
        }

        const admin = createAdminClient();
        let inserted = 0;
        let skippedShort = 0;

        // Process in batches
        for (let i = 0; i < entries.length; i += BATCH_SIZE) {
            const batch = entries.slice(i, i + BATCH_SIZE);

            const rows = batch
                .filter((e) => {
                    if (e.ms_played < MIN_MS_PLAYED) {
                        skippedShort++;
                        return false;
                    }
                    if (!e.spotify_track_uri) return false;
                    return true;
                })
                .map((e) => ({
                    spotify_user_id: userId,
                    ts: e.ts,
                    ms_played: e.ms_played,
                    track_name: e.master_metadata_track_name ?? null,
                    artist_name: e.master_metadata_album_artist_name ?? null,
                    album_name: e.master_metadata_album_album_name ?? null,
                    spotify_track_uri: e.spotify_track_uri ?? null,
                    skipped: e.skipped ?? false,
                    source: "import" as const,
                }));

            if (rows.length === 0) continue;

            const { error, count } = await admin
                .from("streaming_history")
                .upsert(rows, {
                    onConflict: "spotify_user_id,ts,spotify_track_uri",
                    count: "exact",
                    ignoreDuplicates: true,
                });

            if (error) {
                console.error("[import] Supabase upsert error:", error);
                // Continue with next batch, don't abort entire import
            } else {
                inserted += count ?? rows.length;
            }
        }

        return NextResponse.json({
            success: true,
            inserted,
            skippedShort,
            total: entries.length,
        });
    } catch (err) {
        console.error("[import] Error:", err);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
