"use client";

import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { FolderOpen, Upload, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import type { SpotifyHistoryEntry } from "@/types/spotify";

const SEND_BATCH = 2000; // how many entries per API call

interface ImportResult {
    inserted: number;
    skippedShort: number;
    total: number;
}

interface FileStatus {
    name: string;
    count: number;
    status: "pending" | "processing" | "done" | "error";
    error?: string;
}

export default function HistoryTab() {
    const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [progress, setProgress] = useState(0);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const processFiles = useCallback(async (files: File[]) => {
        const jsonFiles = files.filter(f => f.name.endsWith(".json"));
        if (!jsonFiles.length) return;

        setImporting(true);
        setResult(null);
        setProgress(0);

        // Parse all files first
        const parsed: { file: File; entries: SpotifyHistoryEntry[] }[] = [];
        const statuses: FileStatus[] = [];

        for (const file of jsonFiles) {
            try {
                const text = await file.text();
                const entries = JSON.parse(text) as SpotifyHistoryEntry[];
                parsed.push({ file, entries });
                statuses.push({ name: file.name, count: entries.length, status: "pending" });
            } catch {
                statuses.push({ name: file.name, count: 0, status: "error", error: "JSON inválido" });
            }
        }
        setFileStatuses(statuses);

        const totalEntries = parsed.reduce((s, p) => s + p.entries.length, 0);
        let totalInserted = 0;
        let totalSkipped = 0;
        let totalProcessed = 0;

        // Upload in batches
        for (let fi = 0; fi < parsed.length; fi++) {
            const { entries } = parsed[fi];

            setFileStatuses(prev => prev.map((s, i) => i === fi ? { ...s, status: "processing" } : s));

            let fileOk = true;
            for (let i = 0; i < entries.length; i += SEND_BATCH) {
                const batch = entries.slice(i, i + SEND_BATCH);
                try {
                    const res = await fetch("/api/history/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ entries: batch }),
                    });
                    const data = await res.json() as ImportResult;
                    totalInserted += data.inserted;
                    totalSkipped += data.skippedShort;
                } catch {
                    fileOk = false;
                }
                totalProcessed += batch.length;
                setProgress(Math.round((totalProcessed / totalEntries) * 100));
            }

            setFileStatuses(prev => prev.map((s, i) =>
                i === fi ? { ...s, status: fileOk ? "done" : "error" } : s
            ));
        }

        setResult({ inserted: totalInserted, skippedShort: totalSkipped, total: totalEntries });
        setImporting(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        processFiles(Array.from(e.dataTransfer.files));
    }, [processFiles]);

    return (
        <div className="space-y-4 max-w-2xl mx-auto">
            {/* Info */}
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/10 text-sm text-amber-300/70">
                <p className="font-semibold text-amber-300 mb-1">📁 Como importar:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Acesse <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noopener noreferrer" className="underline">spotify.com/account/privacy</a> e solicite o &quot;Histórico estendido de streaming&quot;</li>
                    <li>Em ~30 dias você receberá um .zip com arquivos <code className="bg-white/10 px-1 rounded">StreamingHistory_music_*.json</code></li>
                    <li>Arraste todos os arquivos aqui — sem duplicatas, pode subir várias vezes</li>
                </ol>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative cursor-pointer flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${dragging
                    ? "border-amber-400 bg-amber-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                    }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept=".json"
                    multiple
                    className="hidden"
                    onChange={e => processFiles(Array.from(e.target.files ?? []))}
                />
                <div className={`p-4 rounded-2xl transition-colors ${dragging ? "bg-amber-500/20" : "bg-white/5"}`}>
                    <Upload className={`w-8 h-8 ${dragging ? "text-amber-400" : "text-zinc-500"}`} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-300">
                        {dragging ? "Soltar arquivos aqui" : "Arraste os JSONs ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-zinc-600 mt-1">StreamingHistory_music_*.json</p>
                </div>
            </div>

            {/* File statuses */}
            {fileStatuses.length > 0 && (
                <div className="space-y-2">
                    {fileStatuses.map((fs, i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
                        >
                            <FolderOpen className="w-4 h-4 text-zinc-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{fs.name}</p>
                                <p className="text-xs text-zinc-600">{fs.count.toLocaleString()} entradas</p>
                            </div>
                            {fs.status === "pending" && <div className="w-4 h-4 rounded-full border border-zinc-600" />}
                            {fs.status === "processing" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />}
                            {fs.status === "done" && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
                            {fs.status === "error" && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                        </div>
                    ))}
                </div>
            )}

            {/* Progress bar */}
            {importing && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>Importando...</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-green-950/30 border border-green-500/20"
                >
                    <p className="font-bold text-green-400 flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4" />
                        Import concluído!
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <Stat label="Total" value={result.total.toLocaleString()} />
                        <Stat label="Inseridos" value={result.inserted.toLocaleString()} color="green" />
                        <Stat label="Ignorados*" value={result.skippedShort.toLocaleString()} color="amber" />
                    </div>
                    <p className="text-xs text-zinc-600 mt-3">*Plays com menos de 30 segundos são ignorados</p>
                </motion.div>
            )}
        </div>
    );
}

function Stat({ label, value, color }: { label: string; value: string; color?: "green" | "amber" }) {
    const colorClass = color === "green" ? "text-green-400" : color === "amber" ? "text-amber-400" : "text-white";
    return (
        <div className="flex flex-col items-center p-3 bg-white/5 rounded-xl">
            <span className={`text-xl font-black ${colorClass}`}>{value}</span>
            <span className="text-xs text-zinc-500 mt-0.5">{label}</span>
        </div>
    );
}
