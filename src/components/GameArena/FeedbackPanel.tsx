import React, { useState } from "react";
import { LevelConfig, DiagnosticDiagnosis } from "../../types";
import { DiagnosticAlert } from "./DiagnosticAlert";
import { ProgressiveHintDrawer } from "./ProgressiveHintDrawer";
import {
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

interface FeedbackPanelProps {
  level: LevelConfig;
  feedback: {
    type: "success" | "error" | "warning" | "info";
    title: string;
    message: string;
    isEfficient?: boolean;
  } | null;
  diagnosis?: DiagnosticDiagnosis | null;
  onOpenReflection: () => void;
  onHintUsed: (level: number) => void;
  hintsUsedCount: number;
  onNextLevel?: () => void;
  hasNextLevel?: boolean;
  failCount?: number;
  onOpenAssistGuide?: () => void;
  onRetry?: () => void;
  onHighlightBlock?: (blockId: string) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  level,
  feedback,
  diagnosis,
  onOpenReflection,
  onHintUsed,
  hintsUsedCount,
  onNextLevel,
  hasNextLevel,
  failCount = 0,
  onOpenAssistGuide,
  onRetry,
  onHighlightBlock,
}) => {
  return (
    <div className="flex flex-col gap-3.5 bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-5 shadow-xl">
      {/* Smart Debugging Assistant Diagnosis Alert if failed */}
      {diagnosis ? (
        <DiagnosticAlert
          diagnosis={diagnosis}
          onRetry={onRetry || (() => {})}
          onHighlightBlock={onHighlightBlock}
          failCount={failCount}
          onOpenAssistGuide={onOpenAssistGuide}
        />
      ) : feedback ? (
        /* Standard Feedback Alert (e.g. Success) */
        <div
          className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 transition-all shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : feedback.type === "error"
              ? "bg-rose-50 border-rose-300 text-rose-900"
              : feedback.type === "warning"
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-blue-50 border-blue-300 text-blue-900"
          }`}
        >
          <div className="p-2 rounded-xl bg-white shadow-xs flex-shrink-0 mt-0.5 border border-black/5">
            {feedback.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />}
            {feedback.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600 stroke-[2.5]" />}
            {feedback.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-600 stroke-[2.5]" />}
            {feedback.type === "info" && <Info className="w-5 h-5 text-blue-600 stroke-[2.5]" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-sm font-black">{feedback.title}</h4>
              {feedback.isEfficient && (
                <span className="flex items-center gap-1 text-[11px] font-black text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Solusi Sangat Efisien & Ringkas! ⭐
                </span>
              )}
            </div>
            <p className="text-xs mt-1 leading-relaxed font-bold opacity-90">{feedback.message}</p>

            {feedback.type === "success" && (
              <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={onOpenReflection}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md border-b-3 border-blue-800 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                  Isi Refleksi Pengalaman 📝
                </button>
                {hasNextLevel && onNextLevel && (
                  <button
                    onClick={onNextLevel}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-md border-b-3 border-emerald-800 active:border-b-0 active:translate-y-0.5 transition-all cursor-pointer"
                  >
                    <span>Lanjut ke Level {level.id + 1}</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 flex items-center gap-3 text-slate-600 text-xs font-bold">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span>
            Pilih balok perintah di atas, lalu klik <strong>Jalankan Program</strong> untuk memandu robot Loopi bergerak! 🚀
          </span>
        </div>
      )}

      {/* 5-Tier Progressive Hint Drawer */}
      <ProgressiveHintDrawer
        level={level}
        hintsUsedCount={hintsUsedCount}
        onHintUsed={onHintUsed}
      />
    </div>
  );
};
