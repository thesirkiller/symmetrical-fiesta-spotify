"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LogOut, Download, Music2, Mic2, Disc3, Clock, Star,
    ChevronLeft, ChevronRight, Share2
} from "lucide-react";
import { spotifyApi } from "@/lib/spotify";
import type {
    SpotifyTopTracksResponse,
    SpotifyTopArtistsResponse,
    SpotifyTrack,
    AlbumStat,
    TimeRange,
} from "@/types/spotify";

// ── Time range config ──────────────────────────────────────────────────────
const TIME_RANGES: { value: TimeRange; label: string; sublabel: string }[] = [
    { value: "short_term", label: "4 Semanas", sublabel: "Últimas 4 semanas" },
    { value: "medium_term", label: "6 Meses", sublabel: "Últimos 6 meses" },
    { value: "long_term", label: "Todo Tempo", sublabel: "Histórico completo" },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function estimateMinutes(tracks: SpotifyTrack[], playsEach = 15) {
    const total = tracks.reduce((acc, t) => acc + t.duration_ms * playsEach, 0);
    return Math.round(total / 1000 / 60);
}

function deriveAlbums(tracks: SpotifyTrack[]): AlbumStat[] {
    const map = new Map<string, AlbumStat>();
    tracks.forEach((t) => {
        const aid = t.album.id;
        const existing = map.get(aid);
        if (existing) {
            existing.trackCount++;
            existing.estimatedMinutes += Math.round(t.duration_ms / 1000 / 60) * 15;
        } else {
            map.set(aid, {
                id: aid,
                name: t.album.name,
                artistName: t.artists[0]?.name ?? "",
                imageUrl: t.album.images[0]?.url ?? "",
                trackCount: 1,
                estimatedMinutes: Math.round(t.duration_ms / 1000 / 60) * 15,
            });
        }
    });
    return Array.from(map.values()).sort((a, b) => b.trackCount - a.trackCount);
}

// ── Share card export ──────────────────────────────────────────────────────
async function exportCard(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    if (!ref.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ref.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
    });
    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

// ── Main component ─────────────────────────────────────────────────────────
export default function WrappedPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<TimeRange>("medium_term");
    const [tracks, setTracks] = useState<SpotifyTopTracksResponse | null>(null);
    const [artists, setArtists] = useState<SpotifyTopArtistsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [cardIndex, setCardIndex] = useState(0);
    const [direction, setDirection] = useState(1);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (status === "unauthenticated") router.push("/login");
    }, [status, router]);

    const fetchData = useCallback(async (range: TimeRange) => {
        const token = (session as any)?.accessToken;
        if (!token) return;
        setLoading(true);
        try {
            const [t, a] = await Promise.all([
                spotifyApi.getTopTracks(token, range),
                spotifyApi.getTopArtists(token, range),
            ]);
            setTracks(t);
            setArtists(a);
            setCardIndex(0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [session]);

    useEffect(() => {
        if (status === "authenticated") fetchData(timeRange);
    }, [status, timeRange, fetchData]);

    const navigate = useCallback((dir: number) => {
        setDirection(dir);
        setCardIndex((i) => Math.max(0, Math.min(cards.length - 1, i + dir)));
    }, []); // eslint-disable-line

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") navigate(1);
            if (e.key === "ArrowLeft") navigate(-1);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [navigate]);

    if (loading || status === "loading") return <LoadingScreen />;

    const topTracks = tracks?.items ?? [];
    const topArtists = artists?.items ?? [];
    const albums = deriveAlbums(topTracks);
    const estimatedMins = estimateMinutes(topTracks);
    const estimatedHrs = Math.round(estimatedMins / 60);

    // Artist estimated hours from their tracks
    const artistHours = topArtists.slice(0, 5).map((artist) => {
        const artistTracks = topTracks.filter((t) =>
            t.artists.some((a) => a.id === artist.id)
        );
        const mins = estimateMinutes(artistTracks);
        return { artist, hours: Math.round(mins / 60), mins };
    });

    const currentRange = TIME_RANGES.find((r) => r.value === timeRange)!;

    const cards = [
        /* 0 – Intro */
        <ShareableCard key="intro" ref={cardRef} gradient="from-purple-900 via-zinc-950 to-blue-950" filename="wrapped-intro">
            <Glow color="purple" />
            <CardBadge icon={<Music2 className="w-4 h-4" />} text={currentRange.sublabel} />
            <div className="flex flex-col items-center text-center gap-4 mt-4">
                <motion.div {...fadeUp(0.1)} className="text-6xl">🎵</motion.div>
                <motion.h1 {...fadeUp(0.2)} className="text-5xl font-black tracking-tighter leading-none">
                    Seu<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 italic">
                        Wrapped
                    </span>
                </motion.h1>
                <motion.p {...fadeUp(0.3)} className="text-zinc-400 text-base max-w-[240px]">
                    {currentRange.sublabel} em música.
                </motion.p>
                <motion.div {...fadeUp(0.4)} className="grid grid-cols-2 gap-3 w-full mt-2">
                    <MiniStat label="Tracks" value={topTracks.length} />
                    <MiniStat label="Artistas" value={topArtists.length} />
                    <MiniStat label="Álbuns" value={albums.length} />
                    <MiniStat label="~Horas" value={estimatedHrs} highlight />
                </motion.div>
            </div>
        </ShareableCard>,

        /* 1 – Top Tracks */
        <ShareableCard key="tracks" ref={cardRef} gradient="from-rose-950 via-zinc-950 to-orange-950" filename="wrapped-tracks">
            <Glow color="rose" />
            <CardBadge icon={<Music2 className="w-4 h-4" />} text="Suas Top Tracks" />
            <motion.div className="flex flex-col gap-2 w-full mt-3" {...fadeUp(0.1)}>
                {topTracks.slice(0, 7).map((track, i) => (
                    <motion.div
                        key={track.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2.5"
                    >
                        <span className="text-xs text-zinc-500 w-5 text-center font-bold">{i + 1}</span>
                        {track.album.images[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={track.album.images[0].url}
                                alt={track.name}
                                className="w-10 h-10 rounded-lg object-cover"
                                crossOrigin="anonymous"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{track.name}</p>
                            <p className="text-xs text-zinc-400 truncate">{track.artists.map((a) => a.name).join(", ")}</p>
                        </div>
                        <span className="text-xs text-zinc-600 shrink-0">
                            {Math.round(track.duration_ms / 60000)}m
                        </span>
                    </motion.div>
                ))}
            </motion.div>
        </ShareableCard>,

        /* 2 – Top Artists */
        <ShareableCard key="artists" ref={cardRef} gradient="from-emerald-950 via-zinc-950 to-teal-950" filename="wrapped-artists">
            <Glow color="emerald" />
            <CardBadge icon={<Mic2 className="w-4 h-4" />} text="Seus Top Artistas" />
            <motion.div className="flex flex-col gap-3 w-full mt-3" {...fadeUp(0.1)}>
                {topArtists.slice(0, 5).map((artist, i) => (
                    <motion.div
                        key={artist.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.08 }}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-3"
                    >
                        <span className="text-sm font-black text-zinc-500 w-6 text-center">#{i + 1}</span>
                        {artist.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={artist.images[0].url}
                                alt={artist.name}
                                className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10"
                                crossOrigin="anonymous"
                            />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="font-bold truncate">{artist.name}</p>
                            <p className="text-xs text-zinc-500 truncate capitalize">
                                {artist.genres?.slice(0, 2).join(" · ") ?? ""}
                            </p>
                        </div>
                        {artistHours[i] && (
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-emerald-400">{artistHours[i].hours}h</p>
                                <p className="text-xs text-zinc-600">~estimado</p>
                            </div>
                        )}
                    </motion.div>
                ))}
            </motion.div>
        </ShareableCard>,

        /* 3 – Top Albums */
        <ShareableCard key="albums" ref={cardRef} gradient="from-blue-950 via-zinc-950 to-indigo-950" filename="wrapped-albums">
            <Glow color="blue" />
            <CardBadge icon={<Disc3 className="w-4 h-4" />} text="Seus Top Álbuns" />
            <motion.div className="grid grid-cols-2 gap-3 w-full mt-3" {...fadeUp(0.1)}>
                {albums.slice(0, 6).map((album, i) => (
                    <motion.div
                        key={album.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.06, type: "spring" }}
                        className="flex flex-col gap-2 bg-white/5 border border-white/5 rounded-2xl p-2.5"
                    >
                        {album.imageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={album.imageUrl}
                                alt={album.name}
                                className="w-full aspect-square rounded-xl object-cover"
                                crossOrigin="anonymous"
                            />
                        )}
                        <div>
                            <p className="text-xs font-bold truncate">{album.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{album.artistName}</p>
                            <p className="text-xs text-blue-400 mt-0.5">{album.trackCount} tracks</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </ShareableCard>,

        /* 4 – Hours Stats */
        <ShareableCard key="hours" ref={cardRef} gradient="from-amber-950 via-zinc-950 to-yellow-950" filename="wrapped-hours">
            <Glow color="amber" />
            <CardBadge icon={<Clock className="w-4 h-4" />} text="Suas Horas" />
            <motion.div className="flex flex-col items-center text-center gap-5 mt-4" {...fadeUp(0.1)}>
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                    <p className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-yellow-600">
                        {estimatedHrs}
                    </p>
                    <p className="text-zinc-400 text-sm tracking-widest uppercase">horas estimadas</p>
                    <p className="text-zinc-600 text-xs mt-1">~15 plays por track</p>
                </motion.div>
                <div className="w-full space-y-2 mt-2">
                    {artistHours.filter(ah => ah.hours > 0).map((ah, i) => (
                        <motion.div
                            key={ah.artist.id}
                            initial={{ width: "0%", opacity: 0 }}
                            animate={{ width: "100%", opacity: 1 }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                            className="flex items-center gap-3"
                        >
                            <span className="text-xs text-zinc-500 w-24 truncate text-right">{ah.artist.name}</span>
                            <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full"
                                    initial={{ width: "0%" }}
                                    animate={{ width: `${Math.min(100, (ah.hours / estimatedHrs) * 100 * topArtists.length * 0.5)}%` }}
                                    transition={{ delay: 0.4 + i * 0.1, duration: 0.8 }}
                                />
                            </div>
                            <span className="text-xs text-amber-400 font-bold w-10">{ah.hours}h</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </ShareableCard>,

        /* 5 – #1 Spotlight */
        <ShareableCard key="spotlight" ref={cardRef} gradient="from-violet-950 via-zinc-950 to-purple-950" filename="wrapped-spotlight">
            <Glow color="violet" />
            <CardBadge icon={<Star className="w-4 h-4" />} text="Seu #1" />
            {topTracks[0] && (
                <motion.div className="flex flex-col items-center text-center gap-4 mt-4" {...fadeUp(0.1)}>
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15, type: "spring" }}
                        className="relative"
                    >
                        <div className="absolute -inset-2 bg-purple-500/30 blur-xl rounded-3xl" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={topTracks[0].album.images[0]?.url}
                            alt={topTracks[0].name}
                            className="relative w-48 h-48 rounded-3xl shadow-2xl object-cover"
                            crossOrigin="anonymous"
                        />
                    </motion.div>
                    <motion.div {...fadeUp(0.25)}>
                        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Track #1</p>
                        <h2 className="text-3xl font-black">{topTracks[0].name}</h2>
                        <p className="text-zinc-400">{topTracks[0].artists.map((a) => a.name).join(", ")}</p>
                    </motion.div>
                    {topArtists[0] && (
                        <motion.div
                            {...fadeUp(0.35)}
                            className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5"
                        >
                            {topArtists[0].images?.[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={topArtists[0].images[0].url}
                                    alt={topArtists[0].name}
                                    className="w-8 h-8 rounded-full object-cover"
                                    crossOrigin="anonymous"
                                />
                            )}
                            <div className="text-left">
                                <p className="text-xs text-zinc-500">Artista #1</p>
                                <p className="text-sm font-bold">{topArtists[0].name}</p>
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </ShareableCard>,
    ];

    // Safe navigate now captures cards.length
    const safeNavigate = (dir: number) => {
        setDirection(dir);
        setCardIndex((i) => Math.max(0, Math.min(cards.length - 1, i + dir)));
    };

    const currentCard = cards[cardIndex];

    return (
        <div className="relative min-h-screen bg-zinc-950 overflow-hidden flex flex-col select-none">
            {/* Top bar */}
            <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-4 pb-2">
                {/* Progress dots */}
                <div className="flex gap-1 flex-1">
                    {cards.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setDirection(i > cardIndex ? 1 : -1); setCardIndex(i); }}
                            className="h-1 flex-1 rounded-full overflow-hidden bg-white/10"
                        >
                            <motion.div
                                className="h-full bg-white/80 rounded-full"
                                animate={{ width: i <= cardIndex ? "100%" : "0%" }}
                                transition={{ duration: 0.3 }}
                            />
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="ml-3 p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                >
                    <LogOut className="w-4 h-4 text-zinc-400" />
                </button>
            </div>

            {/* Period selector */}
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex gap-1 bg-black/60 backdrop-blur border border-white/10 rounded-full px-1.5 py-1.5">
                {TIME_RANGES.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => setTimeRange(r.value)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${timeRange === r.value
                            ? "bg-white text-black"
                            : "text-zinc-400 hover:text-white"
                            }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Share button */}
            <button
                onClick={() => {
                    const filenames = ["wrapped-intro", "wrapped-tracks", "wrapped-artists", "wrapped-albums", "wrapped-hours", "wrapped-spotlight"];
                    exportCard(cardRef, filenames[cardIndex] ?? "wrapped");
                }}
                className="fixed bottom-16 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl transition-all backdrop-blur text-xs font-bold"
            >
                <Share2 className="w-3.5 h-3.5" />
                <Download className="w-3.5 h-3.5" />
                <span>Salvar</span>
            </button>

            {/* Story area */}
            <div className="flex-1 flex items-center justify-center pt-16 pb-28">
                <div className="relative w-full max-w-sm mx-auto" style={{ height: "calc(100vh - 12rem)" }}>
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={cardIndex}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
                        >
                            {currentCard}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* Side nav */}
            <div className="fixed inset-y-0 left-0 right-0 flex items-center justify-between px-2 pointer-events-none z-40">
                <button
                    onClick={() => safeNavigate(-1)}
                    disabled={cardIndex === 0}
                    className="pointer-events-auto p-3 bg-black/40 hover:bg-black/70 border border-white/10 rounded-full backdrop-blur disabled:opacity-0 transition-all"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={() => safeNavigate(1)}
                    disabled={cardIndex === cards.length - 1}
                    className="pointer-events-auto p-3 bg-black/40 hover:bg-black/70 border border-white/10 rounded-full backdrop-blur disabled:opacity-0 transition-all"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}

// ── Shareable Card wrapper (forwarded ref for html2canvas) ─────────────────

const ShareableCard = React.forwardRef<HTMLDivElement, {
    children: React.ReactNode;
    gradient: string;
    filename: string;
}>(({ children, gradient, filename: _filename }, ref) => (
    <div
        ref={ref}
        className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-start p-6 overflow-hidden relative`}
    >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.04)_0%,transparent_70%)] pointer-events-none" />

        {/* Watermark */}
        <div className="absolute bottom-4 right-4 text-[10px] text-white/20 font-bold tracking-widest uppercase">
            Antigravity Wrapped
        </div>
        <div className="relative z-10 flex flex-col items-center w-full gap-3 h-full">
            {children}
        </div>
    </div>
));
ShareableCard.displayName = "ShareableCard";

// ── Sub-components ─────────────────────────────────────────────────────────
function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
            <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
                    <Music2 className="absolute inset-0 m-auto w-7 h-7 text-purple-400" />
                </div>
                <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Carregando...</p>
            </motion.div>
        </div>
    );
}

function CardBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs text-zinc-400 uppercase tracking-widest self-center">
            {icon}
            {text}
        </div>
    );
}

function MiniStat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div className={`flex flex-col items-center p-3 rounded-2xl border ${highlight ? "bg-purple-900/20 border-purple-500/20" : "bg-white/5 border-white/5"}`}>
            <span className={`text-2xl font-black ${highlight ? "text-purple-300" : "text-white"}`}>{value}</span>
            <span className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{label}</span>
        </div>
    );
}

function Glow({ color }: { color: string }) {
    const colorMap: Record<string, string> = {
        purple: "bg-purple-600/20",
        rose: "bg-rose-600/15",
        emerald: "bg-emerald-600/15",
        blue: "bg-blue-600/15",
        amber: "bg-amber-600/15",
        violet: "bg-violet-600/20",
    };
    return (
        <div className={`absolute top-[-20%] left-[-20%] w-[60%] h-[60%] ${colorMap[color]} rounded-full blur-3xl pointer-events-none`} />
    );
}

// ── Animation variants ─────────────────────────────────────────────────────
const slideVariants = {
    enter: (dir: number) => ({
        x: dir > 0 ? "100%" : "-100%",
        opacity: 0,
        scale: 0.95,
    }),
    center: (_dir: number) => ({
        x: 0,
        opacity: 1,
        scale: 1,
        transition: { type: "spring" as const, stiffness: 280, damping: 28 },
    }),
    exit: (dir: number) => ({
        x: dir > 0 ? "-30%" : "30%",
        opacity: 0,
        scale: 0.95,
        transition: { duration: 0.2 },
    }),
};

function fadeUp(delay: number) {
    return {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay, duration: 0.4 },
    };
}
