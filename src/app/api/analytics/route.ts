import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: any) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam && !isNaN(parseInt(yearParam)) ? parseInt(yearParam) : null;

    const userId = (session as any).spotifyUserId;
    const admin = createAdminClient();

    try {
        // 1. Available Years
        const { data: availableYears } = await admin.rpc("get_available_years", {
            p_user_id: userId
        });

        // 2. Listening time per day (last 30 days OR whole year)
        const { data: dailyData } = await admin.rpc("get_daily_listening_stats", {
            p_user_id: userId,
            p_days: 30,
            p_year: year
        });

        // 3. Hourly activity (heatmap)
        const { data: hourlyData } = await admin.rpc("get_hourly_listening_stats", {
            p_user_id: userId,
            p_year: year
        });

        // 4. Top Artists (from DB history)
        const { data: topArtists } = await admin.rpc("get_top_history_artists", {
            p_user_id: userId,
            p_limit: 10,
            p_year: year
        });

        // 5. Oldest Tracks (First 10)
        const { data: oldestTracks } = await admin.rpc("get_oldest_tracks", {
            p_user_id: userId,
            p_limit: 10
        });

        // 6. Overall stats (filtered by year if provided)
        let query = admin
            .from("streaming_history")
            .select("ms_played, ts")
            .eq("spotify_user_id", userId);

        if (year) {
            // Since we don't have a specific index for YEAR(ts), we filter by date range
            query = query
                .gte("ts", `${year}-01-01T00:00:00Z`)
                .lte("ts", `${year}-12-31T23:59:59Z`);
        }

        const { data: totals } = await query;

        const totalMs = totals?.reduce((acc, curr) => acc + curr.ms_played, 0) || 0;
        const totalTracks = totals?.length || 0;

        return NextResponse.json({
            daily: dailyData || [],
            hourly: hourlyData || [],
            topArtists: topArtists || [],
            oldestTracks: oldestTracks || [],
            availableYears: (availableYears || []).map((y: any) => y.year),
            summary: {
                totalHours: Math.round(totalMs / 3600000),
                totalTracks,
                averagePerDay: year
                    ? Math.round((totalMs / 3600000) / 365) // Approx for whole year
                    : Math.round((totalMs / 3600000) / 30)   // Last 30 days
            }
        });
    } catch (err) {
        console.error("[analytics]", err);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
