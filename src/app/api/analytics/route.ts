import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session as any).spotifyUserId;
    const admin = createAdminClient();

    try {
        // 1. Listening time per day (last 30 days)
        const { data: dailyData } = await admin.rpc("get_daily_listening_stats", {
            p_user_id: userId,
            p_days: 30
        });

        // 2. Hourly activity (heatmap)
        const { data: hourlyData } = await admin.rpc("get_hourly_listening_stats", {
            p_user_id: userId
        });

        // 3. Top Artists (from DB history)
        const { data: topArtists } = await admin.rpc("get_top_history_artists", {
            p_user_id: userId,
            p_limit: 10
        });

        // 4. Overall stats
        const { data: totals } = await admin
            .from("streaming_history")
            .select("ms_played")
            .eq("spotify_user_id", userId);

        const totalMs = totals?.reduce((acc, curr) => acc + curr.ms_played, 0) || 0;
        const totalTracks = totals?.length || 0;

        return NextResponse.json({
            daily: dailyData || [],
            hourly: hourlyData || [],
            topArtists: topArtists || [],
            summary: {
                totalHours: Math.round(totalMs / 3600000),
                totalTracks,
                averagePerDay: Math.round((totalMs / 3600000) / 30)
            }
        });
    } catch (err) {
        console.error("[analytics]", err);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
