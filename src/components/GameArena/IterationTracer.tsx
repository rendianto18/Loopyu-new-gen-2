import React, { useState } from "react";
import { IterationTrace } from "../../types";
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Compass,
  Repeat,
} from "lucide-react";

interface IterationTracerProps {
  traces: IterationTrace[];
  activeStepIndex?: number;
  isSimulating?: boolean;
}

export const IterationTracer: React.FC<IterationTracerProps> = ({
  traces,
  activeStepIndex = 0,
  isSimulating = false,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTraceIdx, setSelectedTraceIdx] = useState<number | null>(null);

  if (!traces || traces.length === 0) {
    return null;
  }

  const activeTrace =
    selectedTraceIdx !== null && traces[selectedTraceIdx]
      ? traces[selectedTraceIdx]
      : traces[traces.length - 1];

  return (
    <div className="bg-slate-900 border-2 border-indigo-900/80 rounded-2xl p-3.5 sm:p-4 text-white shadow-lg space-y-3 transition-all animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                Panel Jejak Iterasi & Variabel (Iteration Tracer)
              </h4>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                {traces.length} Langkah Terlacak
              </span>
              {isSimulating && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Live Simulasi
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Amati proses evaluasi kondisi, nilai variabel perulangan, dan alasan mengapa loop berhenti.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer border border-slate-700"
          title={isExpanded ? "Sembunyikan Jejak Iterasi" : "Buka Jejak Iterasi"}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          {/* Quick Variable Value Sequence Strip (e.g. 1 → 2 → 3 → 4 → 5 → STOP) */}
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-mono">
            <span className="text-slate-400 font-sans font-bold text-[11px] flex-shrink-0 uppercase tracking-wider">
              Urutan Nilai:
            </span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {traces.map((tr, idx) => {
                const isSelected = selectedTraceIdx === idx;
                return (
                  <React.Fragment key={idx}>
                    <button
                      onClick={() => setSelectedTraceIdx(idx)}
                      className={`px-2 py-1 rounded-lg border text-xs font-black transition-all cursor-pointer flex-shrink-0 ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-400/60 shadow-xs"
                          : tr.conditionResult
                          ? "bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800"
                          : "bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900"
                      }`}
                      title={tr.explanation}
                    >
                      {tr.variableName}={tr.variableValue}
                    </button>
                    {idx < traces.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Active / Inspected Step Detail Card */}
          {activeTrace && (
            <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/90 space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Inspeksi Iterasi
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
                    Variabel: {activeTrace.variableName} = {activeTrace.variableValue}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold text-[11px]">Kondisi:</span>
                  <code className="text-amber-300 font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60">
                    {activeTrace.conditionExpr}
                  </code>
                  {activeTrace.conditionResult ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> TRUE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                      <XCircle className="w-3 h-3 text-rose-400" /> FALSE (Berhenti)
                    </span>
                  )}
                </div>
              </div>

              {/* Pedagogical Explanation */}
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-slate-300 leading-relaxed font-sans text-xs">
                <p>
                  💡 <strong className="text-white">{activeTrace.explanation}</strong>
                </p>
                {activeTrace.stepExpr && (
                  <p className="mt-1 text-[11px] text-slate-400 font-mono">
                    Perubahan nilai: <span className="text-sky-300">{activeTrace.stepExpr}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Detailed Iteration Process Table */}
          <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 text-[10px] uppercase tracking-wider font-sans">
                  <th className="p-2 pl-3">No</th>
                  <th className="p-2">Variabel</th>
                  <th className="p-2">Uji Kondisi</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Aksi / Perintah</th>
                  <th className="p-2 pr-3">Langkah Lanjut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-[11px]">
                {traces.map((trace, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedTraceIdx(idx)}
                    className={`transition-colors cursor-pointer ${
                      selectedTraceIdx === idx
                        ? "bg-indigo-950/70 text-indigo-200 font-bold"
                        : "hover:bg-slate-900/70 text-slate-300"
                    }`}
                  >
                    <td className="p-2 pl-3 text-slate-500 font-bold">{idx + 1}</td>
                    <td className="p-2 text-sky-300">
                      {trace.variableName} = {trace.variableValue}
                    </td>
                    <td className="p-2 text-amber-300">{trace.conditionExpr}</td>
                    <td className="p-2">
                      {trace.conditionResult ? (
                        <span className="text-emerald-400 font-bold">TRUE ✓</span>
                      ) : (
                        <span className="text-rose-400 font-bold">FALSE ✕</span>
                      )}
                    </td>
                    <td className="p-2 text-slate-300 font-sans">{trace.actionName}</td>
                    <td className="p-2 pr-3 text-slate-400">{trace.stepExpr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
