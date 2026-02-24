"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Radio, Music2, Clock } from "lucide-react";
import type { SpotifyCurrentlyPlaying, SpotifyRecentlyPlayedResponse } from "@/types/spotify";

function formatRelativeTime(playedAt: string): string {
    const diff = Date.now() - new Date(playedAt).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
}

export default function NowPlayingTab() {
    const [nowPlaying, setNowPlaying] = useState<SpotifyCurrentlyPlaying | null>(null);
    const [recent, setRecent] = useState<SpotifyRecentlyPlayedResponse["items"]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNowPlaying = useCallback(async () => {
        try {
            const res = await fetch("/api/spotify/now-playing");
            if (res.ok) {
                const data = await res.json() as SpotifyCurrentlyPlaying;
                setNowPlaying(data);
            }
        } catch { /* ignore */ }
    }, []);

    const fetchRecent = useCallback(async () => {
        try {
            const res = await fetch("/api/spotify/recently-played");
            if (res.ok) {
                const data = await res.json() as SpotifyRecentlyPlayedResponse;
                setRecent(data.items ?? []);
            }
        } catch { /* ignore */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchNowPlaying();
        fetchRecent();
        // Poll now playing every 30s
        const interval = setInterval(fetchNowPlaying, 30_000);
        return () => clearInterval(interval);
    }, [fetchNowPlaying, fetchRecent]);

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Now Playing Card */}
            <NowPlayingCard nowPlaying={nowPlaying} loading={loading} />

            {/* Recently Played */}
            {!loading && recent.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        <span className="text-xs text-zinc-500 uppercase tracking-widest">Últimas 50</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        {recent.map((item, i) => (
                            <motion.a
                                key={`${item.track.id}-${item.played_at}`}
                                href={item.track.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.02 }}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                            >
                                {/* Album art */}
                                <div className="relative shrink-0">
                                    {item.track.album.images[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={item.track.album.images[0].url}
                                            alt={item.track.name}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                            <Music2 className="w-4 h-4 text-zinc-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Track info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate group-hover:text-white transition-colors">
                                        {item.track.name}
                                    </p>
                                    <p className="text-xs text-zinc-500 truncate">
                                        {item.track.artists.map((a) => a.name).join(", ")}
                                    </p>
                                </div>

                                {/* Relative time */}
                                <span className="text-xs text-zinc-600 shrink-0">
                                    {formatRelativeTime(item.played_at)}
                                </span>
                            </motion.a>
                        ))}
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex flex-col gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5">
                            <div className="w-10 h-10 rounded-lg bg-white/5 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 bg-white/5 rounded animate-pulse w-3/4" />
                                <div className="h-2 bg-white/5 rounded animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function NowPlayingCard({ nowPlaying, loading }: {
    nowPlaying: SpotifyCurrentlyPlaying | null;
    loading: boolean;
}) {
    const isPlaying = nowPlaying?.is_playing && nowPlaying.item;

    return (
        <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-500 ${isPlaying
            ? "bg-gradient-to-br from-purple-950/80 via-zinc-900/80 to-blue-950/80 border-purple-500/20"
            : "bg-white/5 border-white/5"
            }`}>
            {/* Animated background when playing */}
            {isPlaying && (
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl" />
                </div>
            )}

            <div className="relative flex items-center gap-4">
                {/* Album art */}
                <div className="relative shrink-0">
                    {isPlaying && nowPlaying.item!.album.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={nowPlaying.item!.album.images[0].url}
                            alt={nowPlaying.item!.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-xl"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center">
                            <Music2 className="w-7 h-7 text-zinc-600" />
                        </div>
                    )}
                    {isPlaying && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5 items-end bg-green-500 rounded-full p-1">
                            {[1, 2, 3].map((bar) => (
                                <motion.div
                                    key={bar}
                                    className="w-0.5 bg-white rounded-full"
                                    animate={{ height: ["4px", "8px", "4px"] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: bar * 0.15 }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                        <Radio className="w-3 h-3" />
                        {loading ? "Verificando..." : isPlaying ? "Tocando agora" : "Nada tocando"}
                    </p>
                    {isPlaying && (
                        <>
                            <p className="font-bold text-base truncate">{nowPlaying.item!.name}</p>
                            <p className="text-sm text-zinc-400 truncate">
                                {nowPlaying.item!.artists.map((a) => a.name).join(", ")}
                            </p>
                            <p className="text-xs text-zinc-600 truncate mt-0.5">
                                {nowPlaying.item!.album.name}
                            </p>
                        </>
                    )}
                    {!loading && !isPlaying && (
                        <p className="text-sm text-zinc-600">Abra o Spotify para começar</p>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            {isPlaying && nowPlaying.progress_ms != null && nowPlaying.item && (
                <div className="mt-3 relative">
                    <div className="h-0.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full transition-all"
                            style={{
                                width: `${(nowPlaying.progress_ms / nowPlaying.item.duration_ms) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
