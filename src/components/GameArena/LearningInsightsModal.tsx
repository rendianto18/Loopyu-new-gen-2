import React from "react";
import { LevelConfig, LearningInsightsData } from "../../types";
import {
  X,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Flame,
  Zap,
  Target,
  RotateCcw,
} from "lucide-react";

interface LearningInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  insights: LearningInsightsData;
  levels: LevelConfig[];
  onSelectLevel: (levelId: number) => void;
}

export const LearningInsightsModal: React.FC<LearningInsightsModalProps> = ({
  isOpen,
  onClose,
  insights,
  levels,
  onSelectLevel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-4 sm:p-6 space-y-5 animate-scaleUp my-8 text-slate-800">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 shadow-xs">
              <TrendingUp className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  LOOPYU 2.0
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Ringkasan Reflektif
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Wawasan Pembelajaran Siswa (Learning Insights) 📊
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            title="Tutup Ringkasan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top 3 Progress KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Completion */}
          <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl border border-indigo-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Misi Diselesaikan
            </span>
            <div className="text-2xl font-black text-indigo-950">
              {insights.completedCount} / {insights.totalLevels}
            </div>
            <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${insights.completionPercentage}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-600">
              {insights.completionPercentage}% Selesai
            </span>
          </div>

          {/* 2. Total Attempts & Fails */}
          <div className="p-3.5 bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Total Percobaan
            </span>
            <div className="text-2xl font-black text-amber-950">
              {insights.totalAttempts} kali
            </div>
            <p className="text-[10px] font-semibold text-slate-600">
              {insights.failedAttemptsTotal} kali iterasi perbaikan bug
            </p>
          </div>

          {/* 3. Hints Used */}
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Bantuan Dibuka
            </span>
            <div className="text-2xl font-black text-emerald-950">
              {insights.hintsUnlockedTotal} tingkat
            </div>
            <p className="text-[10px] font-semibold text-slate-600">
              Bantuan bertahap mandiri
            </p>
          </div>
        </div>

        {/* Current EL Learning Stage */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              Tahap Belajar: <strong className="text-indigo-600">{insights.learningStage}</strong>
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Pendekatan Experiential Learning (Kolb)
          </span>
        </div>

        {/* Concepts Practiced Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-indigo-600" />
              <span>Status Konsep yang Dipelajari</span>
            </h4>
            <span className="text-[10px] text-slate-500">
              Berdasarkan keberhasilan & iterasi perbaikan
            </span>
          </div>

          <div className="space-y-1.5">
            {insights.conceptsPracticed.map((concept) => (
              <div
                key={concept.id}
                className="p-3 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50/70 transition-all flex items-center justify-between gap-3 flex-wrap"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{concept.name}</span>
                    <span className="text-[10px] text-slate-400">
                      (Level {concept.levelIds.join(", ")})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{concept.description}</p>
                </div>

                <div>
                  {concept.status === "mastered" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                      <CheckCircle2 className="w-3 h-3" />
                      Dikuasai ✓
                    </span>
                  ) : concept.status === "needs_review" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-300">
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                      Perlu Ditinjau
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-[10px] font-black border border-blue-300">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      Dipraktikkan
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested Review Topics */}
        {insights.suggestedReviews.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-black text-xs">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Rekomendasi Topik Penguatan / Review 💡</span>
            </div>

            <div className="space-y-2">
              {insights.suggestedReviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 flex-wrap shadow-2xs"
                >
                  <div className="space-y-0.5 max-w-md">
                    <span className="text-xs font-bold text-slate-900">{rev.topic}</span>
                    <p className="text-[11px] text-slate-600">{rev.reason}</p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectLevel(rev.recommendedLevelId);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer flex-shrink-0"
                  >
                    <span>Buka Level {rev.recommendedLevelId}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500">
            * Data disimpan secara lokal di browser selama sesi pembelajaran.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
