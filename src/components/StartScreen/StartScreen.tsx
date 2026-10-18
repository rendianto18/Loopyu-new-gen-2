import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { INITIAL_8_LEVELS } from "../../data/levelsData";
import { soundManager } from "../../utils/audio";
import { CompletionCertificateModal } from "../GameArena/CompletionCertificateModal";
import {
  Play,
  Sparkles,
  Zap,
  CheckCircle2,
  Cpu,
  ArrowRight,
  Award,
  Gamepad2,
  Code2,
  RotateCcw,
} from "lucide-react";

export const StartScreen: React.FC<{
  onStart: () => void;
  onSelectLevel: (levelId: number) => void;
}> = ({ onStart, onSelectLevel }) => {
  const { currentLevel } = useApp();
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Load completed levels from localStorage (sanitized strictly for 8 levels)
  const completedLevels: number[] = (() => {
    try {
      const saved = localStorage.getItem("loopyu_completed_levels");
      return saved
        ? (JSON.parse(saved) as number[]).filter((n) => typeof n === "number" && n >= 1 && n <= 8)
        : [];
    } catch {
      return [];
    }
  })();

  const nextUnlocked = INITIAL_8_LEVELS.find((l) => !completedLevels.includes(l.id))?.id || 1;
  const isAllCompleted = completedLevels.length >= INITIAL_8_LEVELS.length;

  // Track elapsed time from stored start time
  const elapsedSeconds: number = (() => {
    try {
      const savedFinal = localStorage.getItem("loopyu_final_elapsed_seconds");
      if (savedFinal) return Number(savedFinal);
      const start = localStorage.getItem("loopyu_start_timestamp");
      if (start) {
        return Math.max(30, Math.floor((Date.now() - Number(start)) / 1000));
      }
      return 480;
    } catch {
      return 480;
    }
  })();

  const handleStartGame = () => {
    if (!localStorage.getItem("loopyu_start_timestamp")) {
      localStorage.setItem("loopyu_start_timestamp", Date.now().toString());
    }
    soundManager.play("win");
    onSelectLevel(nextUnlocked);
    onStart();
  };

  const handleRestartFromLevel1 = () => {
    soundManager.playClick();
    onSelectLevel(1);
    onStart();
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center py-8 px-4 sm:px-6 max-w-4xl mx-auto animate-fadeIn select-none">
      {/* Central Start Game Card */}
      <div className="w-full flex flex-col items-center text-center space-y-6">
        
        {/* Animated Robot Mascot */}
        <div
          className="relative group cursor-pointer"
          onClick={handleStartGame}
          title="Klik untuk Mulai Game!"
        >
          {/* Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/40 via-indigo-600/40 to-pink-500/40 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity animate-pulse" />

          <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-pink-500 p-1.5 shadow-2xl group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center relative overflow-hidden">
              {/* Circuit grid background */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:12px_12px]" />

              {/* Robot Face */}
              <div className="flex flex-col items-center justify-center space-y-2.5 relative z-10">
                {/* Antennas */}
                <div className="flex items-center gap-4 -mt-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                {/* Neon Eyes */}
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                  <div className="w-5 h-5 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee] flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
                {/* Happy Mouth */}
                <div className="w-7 h-2 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full shadow-xs" />
              </div>
            </div>
          </div>

          <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1">
            <Zap className="w-3 h-3 fill-slate-950" />
            <span>8 Level</span>
          </div>
        </div>

        {/* Title & Tagline - Clean & Direct */}
        <div className="space-y-1 max-w-md">
          <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
            LOOP<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600">YU</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 font-semibold">
            Petualangan Logika Pemrograman Robot
          </p>
        </div>

        {/* Progress Tracker (if any level completed) */}
        {completedLevels.length > 0 && (
          <div className="w-full max-w-sm p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Progres Misi</span>
              </span>
              <span className="text-emerald-700">
                {completedLevels.length} / {INITIAL_8_LEVELS.length} Selesai
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-500 rounded-full"
                style={{
                  width: `${(completedLevels.length / INITIAL_8_LEVELS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action Button Row */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
          <button
            onClick={handleStartGame}
            className="w-full px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 hover:from-blue-700 hover:via-indigo-700 hover:to-pink-700 active:scale-95 text-white font-black text-base sm:text-lg shadow-xl hover:shadow-indigo-300 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="w-4 h-4 fill-white" />
            </div>
            <span>
              {completedLevels.length === 0
                ? "MULAI GAME"
                : isAllCompleted
                ? "MAIN KEMBALI"
                : `LANJUTKAN LEVEL ${nextUnlocked}`}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          {/* Secondary Buttons: Certificate or Restart */}
          {completedLevels.length >= 1 && (
            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => setShowCertificateModal(true)}
                className="flex-1 px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border-2 border-indigo-200 text-indigo-700 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Sertifikat & Refleksi</span>
              </button>

              <button
                onClick={handleRestartFromLevel1}
                title="Mulai ulang dari Level 1"
                className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Level 1</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Completion & Certificate Modal */}
      <CompletionCertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        completedCount={completedLevels.length}
        totalMissions={INITIAL_8_LEVELS.length}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  );
};
