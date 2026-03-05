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
                .map((e) => {
                    // Normalize fields from different formats
                    const msPlayed = e.ms_played ?? e.msPlayed ?? 0;
                    const ts = e.ts ?? (e.endTime ? new Date(e.endTime + "Z").toISOString() : null);
                    const trackName = e.master_metadata_track_name ?? e.trackName ?? null;
                    const artistName = e.master_metadata_album_artist_name ?? e.artistName ?? null;
                    const albumName = e.master_metadata_album_album_name ?? null;

                    if (msPlayed < MIN_MS_PLAYED) {
                        skippedShort++;
                        return null;
                    }

                    if (!ts || (!trackName && !artistName)) return null;

                    return {
                        spotify_user_id: userId,
                        ts,
                        ms_played: msPlayed,
                        track_name: trackName,
                        artist_name: artistName,
                        album_name: albumName,
                        spotify_track_uri: e.spotify_track_uri ?? null,
                        skipped: e.skipped ?? false,
                        source: "import" as const,
                    };
                })
                .filter((row): row is NonNullable<typeof row> => row !== null);

            if (rows.length === 0) continue;

            const { error, count } = await admin
                .from("streaming_history")
                .upsert(rows, {
                    onConflict: "spotify_user_id,ts,track_name", // Use track_name for Basic history which lacks URI
                    count: "exact",
                    ignoreDuplicates: true,
                });

            if (error) {
                console.error("[import] Supabase upsert error:", error);
                // If the specific onConflict fails (e.g. if the constraint is different), 
                // we try to at least log what happened.
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
