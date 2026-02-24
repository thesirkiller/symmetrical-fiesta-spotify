"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Music, Zap } from "lucide-react";

export default function LoginPage() {
    const { status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "authenticated") {
            router.push("/");
        }
    }, [status, router]);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-mesh">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative z-10 glass p-8 md:p-12 rounded-[2rem] max-w-md w-full text-center shadow-2xl"
            >
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex justify-center mb-6"
                >
                    <div className="p-4 bg-purple-600 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                        <Music className="w-8 h-8 text-white" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
                >
                    Antigravity Wrapped
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-zinc-400 mb-10 leading-relaxed"
                >
                    Descubra sua jornada musical e veja como o Antigravity dominou seus fones de ouvido este ano.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    <button
                        onClick={() => signIn("spotify")}
                        className="group relative w-full py-4 bg-white text-black font-semibold rounded-xl overflow-hidden active:scale-[0.98] transition-all transform"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity" />
                        <div className="flex items-center justify-center gap-2">
                            <Zap className="w-5 h-5 fill-current" />
                            <span>Conectar com Spotify</span>
                        </div>
                    </button>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-8 text-xs text-zinc-500"
                >
                    Ao entrar, você concorda com o processamento dos seus dados de escuta do Spotify.
                </motion.p>
            </motion.div>

            {/* Footer Branding */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-10 text-zinc-600 text-sm tracking-[0.2em] font-medium uppercase"
            >
                Antigravity wrapped
            </motion.div>
        </div>
    );
}
