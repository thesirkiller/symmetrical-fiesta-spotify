"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Music2, ExternalLink, Loader2, RefreshCw, Check } from "lucide-react";
import type { SpotifyRecommendationsResponse, SpotifyTrack } from "@/types/spotify";

export default function DiscoverTab() {
    const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedUrl, setSavedUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    async function generatePlaylist() {
        setLoading(true);
        setError(null);
        setSavedUrl(null);
        try {
            const res = await fetch("/api/spotify/recommendations");
            if (!res.ok) throw new Error("Falha ao buscar recomendações");
            const data = await res.json() as SpotifyRecommendationsResponse;
            setTracks(data.tracks ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
        setLoading(false);
    }

    async function savePlaylist() {
        if (!tracks.length) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/spotify/create-playlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trackUris: tracks.map((t) => t.uri) }),
            });
            if (!res.ok) throw new Error("Falha ao criar playlist");
            const data = await res.json() as { url: string; name: string };
            setSavedUrl(data.url);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
        setSaving(false);
    }

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Header card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-zinc-900/60 to-teal-950/60 border border-emerald-500/10">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="font-bold text-base">Descobrir Músicas</h2>
                        <p className="text-sm text-zinc-400 mt-0.5">
                            20 músicas novas baseadas no que você mais ouviu recentemente
                        </p>
                    </div>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={generatePlaylist}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-sm font-bold rounded-xl transition-all"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        {tracks.length > 0 ? "Gerar novamente" : "Gerar Playlist"}
                    </button>

                    {tracks.length > 0 && !savedUrl && (
                        <button
                            onClick={savePlaylist}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 disabled:opacity-50 border border-white/10 text-sm font-bold rounded-xl transition-all"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Salvar no Spotify
                        </button>
                    )}

                    {savedUrl && (
                        <a
                            href={savedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold rounded-xl hover:bg-green-500/30 transition-all"
                        >
                            <Check className="w-4 h-4" />
                            Abrir no Spotify
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                </div>
                {error && (
                    <p className="mt-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}
            </div>

            {/* Track list */}
            <AnimatePresence>
                {tracks.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col gap-1"
                    >
                        <p className="text-xs text-zinc-500 uppercase tracking-widest px-1 mb-2">
                            {tracks.length} recomendações
                        </p>
                        {tracks.map((track, i) => (
                            <motion.a
                                key={track.id}
                                href={track.external_urls.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group"
                            >
                                <span className="text-xs text-zinc-600 w-5 text-center font-bold shrink-0">{i + 1}</span>
                                {track.album.images[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={track.album.images[0].url}
                                        alt={track.name}
                                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                        <Music2 className="w-4 h-4 text-zinc-600" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate group-hover:text-white transition-colors">{track.name}</p>
                                    <p className="text-xs text-zinc-500 truncate">{track.artists.map(a => a.name).join(", ")}</p>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-400 shrink-0 transition-colors" />
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {!loading && tracks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Sparkles className="w-10 h-10 text-zinc-700 mb-4" />
                    <p className="text-zinc-500 text-sm">Clique em &quot;Gerar Playlist&quot; para descobrir músicas novas</p>
                </div>
            )}
        </div>
    );
}
