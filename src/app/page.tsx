"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Music, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-mesh px-4">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-40 animate-pulse" />
            <div className="relative p-6 bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl">
              <Music className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
            Seu ano com <br />
            <span className="bg-gradient-to-r from-purple-400 via-white to-blue-400 bg-clip-text text-transparent italic">
              Antigravity
            </span>
          </h1>

          <p className="text-zinc-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Mergulhe nas estatísticas da sua jornada musical. Uma experiência visual única moldada pelos seus dados do Spotify.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href={status === "authenticated" ? "/wrapped" : "/login"}
            className="group relative px-8 py-4 bg-white text-black font-bold rounded-2xl flex items-center gap-2 hover:scale-105 transition-transform active:scale-95"
          >
            <span>{status === "authenticated" ? "Ver meu Wrapped" : "Começar Agora"}</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>

          <button className="px-8 py-4 bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white font-medium rounded-2xl flex items-center gap-2 hover:bg-zinc-800 transition-colors">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Ver Ranking Global</span>
          </button>
        </motion.div>
      </div>

      {/* Stats/Preview placeholder */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-10 left-0 w-full flex justify-around text-[10px] tracking-[0.4em] uppercase font-bold text-zinc-500 whitespace-nowrap overflow-hidden pointer-events-none"
      >
        <span>Data Driven Stories</span>
        <span className="hidden md:inline">Visual Experience</span>
        <span>Antigravity Audio Visual</span>
        <span className="hidden md:inline">Spotify Wrapped Theme</span>
      </motion.div>
    </main>
  );
}
