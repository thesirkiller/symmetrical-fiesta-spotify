"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, ArrowRight, Sparkles } from "lucide-react";

export default function WrappedTab() {
    return (
        <div className="max-w-2xl mx-auto space-y-4">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/60 via-zinc-900/60 to-pink-950/60 p-6">
                <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[60%] bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring" }}
                        className="text-5xl mb-4"
                    >
                        🎁
                    </motion.div>
                    <h2 className="text-2xl font-black tracking-tighter">
                        Seu{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 italic">
                            Wrapped
                        </span>
                    </h2>
                    <p className="text-sm text-zinc-400 mt-2 mb-5">
                        Top tracks, artistas, álbuns e horas estimadas em formato de stories prontos para compartilhar.
                    </p>
                    <Link
                        href="/wrapped"
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg group"
                    >
                        <Gift className="w-4 h-4" />
                        Ver meu Wrapped
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Periods */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "4 Semanas", desc: "Short term", color: "from-purple-500/20 to-purple-500/5", border: "border-purple-500/20" },
                    { label: "6 Meses", desc: "Medium term", color: "from-blue-500/20 to-blue-500/5", border: "border-blue-500/20" },
                    { label: "Todo Tempo", desc: "Long term", color: "from-rose-500/20 to-rose-500/5", border: "border-rose-500/20" },
                ].map((period, i) => (
                    <motion.div
                        key={period.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-3 rounded-xl bg-gradient-to-b ${period.color} border ${period.border} text-center`}
                    >
                        <p className="font-bold text-sm">{period.label}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{period.desc}</p>
                    </motion.div>
                ))}
            </div>

            {/* Coming soon — historical wrapped */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold">Wrapped por Ano</span>
                    <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">Em breve</span>
                </div>
                <p className="text-xs text-zinc-500">
                    Importe seu histórico na aba &quot;Histórico&quot; para desbloquear Wrappeds de cada ano com dados reais de streaming.
                </p>
            </div>
        </div>
    );
}
