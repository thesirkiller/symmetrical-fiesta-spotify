"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radio, Sparkles, FolderOpen, Gift, LogOut, Music2, BarChart3
} from "lucide-react";
import NowPlayingTab from "@/components/dashboard/NowPlayingTab";
import DiscoverTab from "@/components/dashboard/DiscoverTab";
import HistoryTab from "@/components/dashboard/HistoryTab";
import WrappedTab from "@/components/dashboard/WrappedTab";

import AnalyticsTab from "@/components/dashboard/AnalyticsTab";

type Tab = "now" | "discover" | "analytics" | "history" | "wrapped";

const TABS: { id: Tab; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { id: "now", label: "Agora", sublabel: "Tocando & Recentes", icon: <Radio className="w-4 h-4" /> },
  { id: "discover", label: "Descobrir", sublabel: "Nova Playlist", icon: <Sparkles className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", sublabel: "Gráficos & Insights", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "history", label: "Histórico", sublabel: "Importar JSON", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "wrapped", label: "Wrapped", sublabel: "Seu ano em música", icon: <Gift className="w-4 h-4" /> },
];

const TAB_COLORS: Record<Tab, string> = {
  now: "from-purple-600 to-blue-600",
  discover: "from-emerald-600 to-teal-600",
  analytics: "from-blue-600 to-indigo-600",
  history: "from-amber-600 to-orange-600",
  wrapped: "from-rose-600 to-pink-600",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("now");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") return <LoadingScreen />;
  if (!session) return null;

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className={`absolute top-[-15%] left-[-10%] w-[60%] h-[60%] bg-gradient-to-br ${TAB_COLORS[activeTab]} opacity-10 rounded-full blur-[120px] transition-all duration-700`} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
            <Music2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">Antigravity</p>
            <p className="text-sm font-bold leading-none">
              {(session?.user?.name ?? "").split(" ")[0]}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-zinc-400 hover:text-white transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </header>

      {/* Tab Bar */}
      <nav className="relative z-10 flex gap-1 px-4 pt-4 pb-2 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${activeTab === tab.id
              ? `bg-gradient-to-r ${TAB_COLORS[tab.id]} text-white shadow-lg`
              : "bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5"
              }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Tab subtitle */}
      <div className="relative z-10 px-6 pb-4">
        <motion.p
          key={activeTab}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-zinc-500 uppercase tracking-widest"
        >
          {currentTab.sublabel}
        </motion.p>
      </div>

      {/* Tab Content */}
      <main className="relative z-10 px-4 pb-8 h-[calc(100vh-180px)] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "now" && <NowPlayingTab />}
            {activeTab === "discover" && <DiscoverTab />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "history" && <HistoryTab />}
            {activeTab === "wrapped" && <WrappedTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-purple-500/20 border-t-purple-400 animate-spin" />
          <Music2 className="absolute inset-0 m-auto w-6 h-6 text-purple-400" />
        </div>
        <p className="text-zinc-500 text-xs tracking-[0.3em] uppercase">Carregando...</p>
      </motion.div>
    </div>
  );
}
