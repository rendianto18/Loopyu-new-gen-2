import React from "react";
import { DiagnosticDiagnosis } from "../../types";
import {
  AlertTriangle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Bug,
  Search,
  ArrowRight,
} from "lucide-react";

interface DiagnosticAlertProps {
  diagnosis: DiagnosticDiagnosis;
  onRetry: () => void;
  onHighlightBlock?: (blockId: string) => void;
  failCount?: number;
  onOpenAssistGuide?: () => void;
}

export const DiagnosticAlert: React.FC<DiagnosticAlertProps> = ({
  diagnosis,
  onRetry,
  onHighlightBlock,
  failCount = 0,
  onOpenAssistGuide,
}) => {
  const isError = diagnosis.severity === "error";
  const isWarning = diagnosis.severity === "warning";

  return (
    <div
      className={`rounded-2xl border-2 p-4 sm:p-5 shadow-md transition-all animate-fadeIn ${
        isError
          ? "bg-rose-50/90 border-rose-300 text-rose-950"
          : isWarning
          ? "bg-amber-50/90 border-amber-300 text-amber-950"
          : "bg-blue-50/90 border-blue-300 text-blue-950"
      }`}
    >
      {/* Header with Title and Error Code Badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap pb-3 border-b border-black/10">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl bg-white shadow-xs border ${
              isError
                ? "text-rose-600 border-rose-200"
                : isWarning
                ? "text-amber-600 border-amber-200"
                : "text-blue-600 border-blue-200"
            }`}
          >
            <Bug className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-black/10 font-mono">
                {diagnosis.code}
              </span>
              <span className="text-[11px] font-bold text-slate-500">
                Asisten Debug Cerdas 🛠️
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-extrabold mt-0.5 text-slate-900">
              {diagnosis.title}
            </h4>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 shadow-xs transition-colors cursor-pointer"
          title="Ulangi simulasi dari posisi awal"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Ulangi Simulasi</span>
        </button>
      </div>

      {/* 4 Pedagogical Diagnostics Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs leading-relaxed">
        {/* 1. What Happened */}
        <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px] uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Apa yang Terjadi?</span>
          </div>
          <p className="text-slate-700 font-medium">{diagnosis.whatHappened}</p>
        </div>

        {/* 2. Why It Matters */}
        <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px] uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Mengapa Ini Penting di Bahasa C?</span>
          </div>
          <p className="text-slate-700 font-medium">{diagnosis.whyItMatters}</p>
        </div>

        {/* 3. Which Block to Inspect */}
        <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px] uppercase tracking-wide">
              <Search className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bagian yang Perlu Diperiksa:</span>
            </div>
            {diagnosis.relatedBlockId && onHighlightBlock && (
              <button
                onClick={() => onHighlightBlock(diagnosis.relatedBlockId!)}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition-colors cursor-pointer"
              >
                Fokuskan Balok
              </button>
            )}
          </div>
          <p className="text-indigo-950 font-bold bg-indigo-50/70 p-2 rounded-lg border border-indigo-100">
            👉 {diagnosis.inspectBlock}
          </p>
        </div>

        {/* 4. Actionable Hint */}
        <div className="p-3 bg-white/90 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-black text-slate-800 text-[11px] uppercase tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Langkah Perbaikan:</span>
          </div>
          <p className="text-emerald-950 font-bold bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
            💡 {diagnosis.actionableHint}
          </p>
        </div>
      </div>

      {/* Persistent Assist Guide trigger if student struggled multiple times */}
      {failCount >= 4 && onOpenAssistGuide && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-100/90 border border-amber-300 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Kamu sudah mencoba {failCount} kali di level ini. Butuh panduan langkah demi langkah?
            </span>
          </div>
          <button
            onClick={onOpenAssistGuide}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Buka Panduan Solusi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
