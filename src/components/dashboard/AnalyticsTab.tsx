"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from "recharts";
import { BarChart3, Clock, Music, Zap, TrendingUp } from "lucide-react";

interface AnalyticsData {
    daily: { date: string; minutes: number }[];
    hourly: { hour: number; count: number }[];
    topArtists: { artist_name: string; play_count: number }[];
    summary: {
        totalHours: number;
        totalTracks: number;
        averagePerDay: number;
    };
}

export default function AnalyticsTab() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/analytics")
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <AnalyticsLoading />;
    if (!data) return <div className="text-center py-20 text-zinc-500">Nenhum dado encontrado. Comece a ouvir ou importe seu histórico!</div>;

    const maxArtistPlays = data.topArtists[0]?.play_count || 1;

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-10">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Horas Totais"
                    value={data.summary.totalHours.toLocaleString()}
                    icon={<Clock className="text-purple-400" />}
                    delay={0}
                />
                <StatCard
                    label="Tracks Totais"
                    value={data.summary.totalTracks.toLocaleString()}
                    icon={<Music className="text-blue-400" />}
                    delay={0.1}
                />
                <StatCard
                    label="Média/Dia (h)"
                    value={data.summary.averagePerDay.toLocaleString()}
                    icon={<TrendingUp className="text-emerald-400" />}
                    delay={0.2}
                />
                <StatCard
                    label="Scrobbles"
                    value={data.summary.totalTracks.toLocaleString()}
                    icon={<Zap className="text-amber-400" />}
                    delay={0.3}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Listening Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-2 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-xl">
                                <BarChart3 className="w-5 h-5 text-purple-400" />
                            </div>
                            <h3 className="font-bold text-lg">Tempo de Audição</h3>
                        </div>
                    </div>

                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.daily}>
                                <defs>
                                    <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                    tickFormatter={(str) => {
                                        try {
                                            return new Date(str).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
                                        } catch (e) { return str; }
                                    }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                    itemStyle={{ color: '#a855f7' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="minutes"
                                    stroke="#a855f7"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorMin)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Hourly Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
                >
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-xl">
                            <Clock className="w-5 h-5 text-blue-400" />
                        </div>
                        Pico de Atividade
                    </h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.hourly}>
                                <XAxis
                                    dataKey="hour"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                    tickFormatter={(h) => `${h}h`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #ffffff10', borderRadius: '12px' }}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={1500}>
                                    {data.hourly.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.count > 0 ? '#3b82f6' : '#3b82f633'}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-zinc-500 mt-4 text-center">
                        Distribuição das faixas ouvidas por hora do dia.
                    </p>
                </motion.div>
            </div>

            {/* Top Artists Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-amber-400" />
                    </div>
                    Top Artistas (Contagem Real)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {data.topArtists.length > 0 ? (
                        data.topArtists.map((artist, index) => (
                            <motion.div
                                key={artist.artist_name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.05 }}
                                className="group flex flex-col gap-2"
                            >
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-semibold text-zinc-200 truncate pr-4">
                                        <span className="text-zinc-500 mr-2 font-mono">{index + 1}.</span>
                                        {artist.artist_name}
                                    </span>
                                    <span className="text-xs font-mono text-zinc-500">
                                        {artist.play_count} plays
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(artist.play_count / maxArtistPlays) * 100}%` }}
                                        transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 group-hover:from-purple-400 group-hover:to-blue-400 transition-colors"
                                    />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-zinc-500 text-sm">Sem dados de artistas ainda.</p>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

function StatCard({ label, value, icon, delay }: { label: string; value: string; icon: React.ReactNode; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5 }}
            className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center text-center gap-2 hover:bg-white/10 transition-colors"
        >
            <div className="p-2 bg-white/5 rounded-2xl mb-1">{icon}</div>
            <span className="text-2xl font-black text-white">{value}</span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">{label}</span>
        </motion.div>
    );
}

function AnalyticsLoading() {
    return (
        <div className="space-y-6 max-w-4xl mx-auto py-10 animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-3xl bg-white/5" />
                ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-80 rounded-3xl bg-white/5" />
                <div className="h-80 rounded-3xl bg-white/5" />
            </div>
        </div>
    );
}
