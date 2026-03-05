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

        // 6. Overall stats (Aggregated in SQL)
        const { data: summaryData } = await admin.rpc("get_analytics_summary", {
            p_user_id: userId,
            p_year: year
        });

        const stats = summaryData?.[0] || { total_ms: 0, play_count: 0, unique_tracks: 0 };
        const totalMs = Number(stats.total_ms);
        const playCount = Number(stats.play_count);
        const uniqueTracks = Number(stats.unique_tracks);

        // Calculate average per day
        let daysToDivide = 30; // Default: Recent
        if (year) {
            const currentYear = new Date().getFullYear();
            if (year === currentYear) {
                // If current year, divide by days passed so far
                const startOfYear = new Date(year, 0, 1);
                const diffTime = Math.abs(new Date().getTime() - startOfYear.getTime());
                daysToDivide = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
            } else {
                daysToDivide = 365; // Previous years
            }
        }

        const averagePerDay = (totalMs / 3600000) / daysToDivide;

        return NextResponse.json({
            daily: dailyData || [],
            hourly: hourlyData || [],
            topArtists: topArtists || [],
            oldestTracks: oldestTracks || [],
            availableYears: (availableYears || []).map((y: any) => y.year),
            summary: {
                totalHours: Math.round(totalMs / 3600000),
                playCount: playCount,
                uniqueTracks: uniqueTracks,
                averagePerDay: averagePerDay < 1 ? Number(averagePerDay.toFixed(2)) : Math.round(averagePerDay)
            }
        });
    } catch (err) {
        console.error("[analytics]", err);
        return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
    }
}
