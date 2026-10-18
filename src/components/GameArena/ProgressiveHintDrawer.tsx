import React, { useState } from "react";
import { LevelConfig, TieredHint } from "../../types";
import { getTieredHintsForLevel } from "../../utils/hintsEngine";
import {
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  Eye,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface ProgressiveHintDrawerProps {
  level: LevelConfig;
  hintsUsedCount: number;
  onHintUsed: (levelNum: number) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const ProgressiveHintDrawer: React.FC<ProgressiveHintDrawerProps> = ({
  level,
  hintsUsedCount,
  onHintUsed,
}) => {
  const tieredHints = getTieredHintsForLevel(level);
  const [openedTier, setOpenedTier] = useState<number | null>(() => {
    return hintsUsedCount > 0 ? hintsUsedCount : 1;
  });

  const handleToggleTier = (tier: number) => {
    if (openedTier === tier) {
      setOpenedTier(null);
    } else {
      setOpenedTier(tier);
      if (tier > hintsUsedCount) {
        onHintUsed(tier);
      }
    }
  };

  return (
    <div className="bg-amber-50/70 border-2 border-amber-200/90 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-amber-200/70">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-400/30">
            <Lightbulb className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950">
              Bantuan Bertahap 5 Tingkat (Progressive Hints)
            </h4>
            <p className="text-[11px] text-slate-600">
              Bantuan bertahap membantumu menalar mandiri tanpa langsung membocorkan jawaban.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-black text-amber-900 bg-white px-2.5 py-0.5 rounded-full border border-amber-300 shadow-2xs">
          Terbuka: <strong className="text-amber-600">{hintsUsedCount}</strong> / 5 Tingkat
        </span>
      </div>

      {/* 5-Tier Accordion */}
      <div className="space-y-2">
        {tieredHints.map((hint) => {
          const isUnlocked = hint.tier <= Math.max(1, hintsUsedCount + 1);
          const isOpen = openedTier === hint.tier;

          return (
            <div
              key={hint.tier}
              className={`rounded-xl border transition-all overflow-hidden bg-white shadow-2xs ${
                isOpen
                  ? "border-amber-400 ring-1 ring-amber-300"
                  : isUnlocked
                  ? "border-slate-200 hover:border-amber-300"
                  : "border-slate-200 opacity-60 bg-slate-50"
              }`}
            >
              <button
                disabled={!isUnlocked}
                onClick={() => handleToggleTier(hint.tier)}
                className={`w-full flex items-center justify-between p-2.5 sm:p-3 text-left transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  isOpen ? "bg-amber-100/50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                      hint.tier <= hintsUsedCount
                        ? "bg-emerald-500 text-white"
                        : isUnlocked
                        ? "bg-amber-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {hint.tier <= hintsUsedCount ? "✓" : hint.tier}
                  </span>
                  <span className="text-xs font-black text-slate-800">{hint.title}</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {hint.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {!isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  ) : isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </button>

              {isOpen && isUnlocked && (
                <div className="p-3.5 bg-amber-50/40 border-t border-amber-200 text-xs text-slate-800 leading-relaxed space-y-2 animate-fadeIn">
                  <p className="font-medium whitespace-pre-line">{hint.content}</p>

                  {/* Optional Example Snippet or Code Illustration */}
                  {hint.exampleSnippet && (
                    <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 font-mono text-[11px] border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Contoh Pola:
                      </span>
                      <pre className="whitespace-pre">{hint.exampleSnippet}</pre>
                    </div>
                  )}

                  {hint.codeIllustration && (
                    <div className="p-2.5 rounded-lg bg-slate-900 text-sky-300 font-mono text-[11px] border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Struktur Kode C Solusi:
                      </span>
                      <pre className="whitespace-pre">{hint.codeIllustration}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
