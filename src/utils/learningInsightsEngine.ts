import { LevelConfig, LearningInsightsData } from "../types";

/**
 * Pure engine that compiles student learning insights from recorded activities.
 * Grounded in actual evidence without exaggerating mastery claims.
 */
export function calculateLearningInsights(
  levels: LevelConfig[],
  completedLevels: number[],
  failedAttemptsByLevel: Record<number, number>,
  hintsUsedByLevel: Record<number, number>,
  errorHistory: Record<string, number> = {}
): LearningInsightsData {
  const totalLevels = levels.length || 8;
  // Deduplicate and ensure valid completed levels
  const uniqueCompleted = Array.from(new Set(completedLevels)).filter(
    (lvl) => lvl >= 1 && lvl <= totalLevels
  );
  const completedCount = uniqueCompleted.length;
  const completionPercentage = Math.round((completedCount / totalLevels) * 100);

  // Calculate attempts
  let failedAttemptsTotal = 0;
  const attemptsByLevel: Record<number, number> = {};

  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    const fails = failedAttemptsByLevel[lvl] || 0;
    const isDone = uniqueCompleted.includes(lvl);
    failedAttemptsTotal += fails;
    // Each level had at least fails attempts, plus 1 if completed
    attemptsByLevel[lvl] = fails + (isDone ? 1 : 0);
  }

  const totalAttempts = Object.values(attemptsByLevel).reduce((a, b) => a + b, 0);

  // Calculate hints
  let hintsUnlockedTotal = 0;
  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    hintsUnlockedTotal += hintsUsedByLevel[lvl] || 0;
  }

  // Determine Experiential Learning Stage (Kolb 4-Stage Cycle)
  let learningStage = "Tahap 1: Concrete Experience (Misi 1–2: Spot the Pattern & Repeat It!)";
  if (completedCount >= 8) {
    learningStage = "Tahap 4: Active Experimentation (Puncak Master: Misi 7–8 Tuntas)";
  } else if (completedCount >= 6) {
    learningStage = "Tahap 4: Active Experimentation (Misi 7–8: Loop Solver & Loop Master)";
  } else if (completedCount >= 4) {
    learningStage = "Tahap 3: Abstract Conceptualization (Misi 5–6: Loop Builder & Keep Going)";
  } else if (completedCount >= 2) {
    learningStage = "Tahap 2: Reflective Observation (Misi 3–4: What Happened? & Break the Pattern)";
  }

  // Concepts evaluation based on real level requirements and attempts
  const conceptsConfig = [
    {
      id: "concept-seq",
      name: "Instruksi Sekuensial & Pengambilan Sasaran",
      description: "Pemahaman eksekusi berurutan dan panggilan fungsi pengambilan baterai `collect()`.",
      levelIds: [1, 2, 3, 4, 5, 6, 7, 8],
    },
    {
      id: "concept-for",
      name: "Perulangan FOR Terhitung (Counter Loop)",
      description: "Penggunaan variabel pencacah, batas iterasi, dan eksekusi instruksi berulang.",
      levelIds: [2, 3, 5, 7, 8],
    },
    {
      id: "concept-while",
      name: "Perulangan WHILE Bersyarat (Condition Loop)",
      description: "Penggunaan sensor kondisi `pathClear()` dan penghentian otomatis saat terhalang.",
      levelIds: [4, 6, 8],
    },
    {
      id: "concept-nav",
      name: "Navigasi Spasial & Belokan Geometris",
      description: "Perubahan haluan 90 derajat (`turnLeft`, `turnRight`) dan siklus lintasan simetris.",
      levelIds: [3, 5, 6, 7, 8],
    },
    {
      id: "concept-combo",
      name: "Kombinasi Struktur Multi-Loop",
      description: "Penggabungan loop FOR dan WHILE dalam satu arsitektur algoritma pemecahan masalah.",
      levelIds: [6, 8],
    },
  ];

  const conceptsPracticed = conceptsConfig.map((concept) => {
    const relatedCompleted = concept.levelIds.filter((id) => uniqueCompleted.includes(id));
    const relatedFails = concept.levelIds.reduce(
      (sum, id) => sum + (failedAttemptsByLevel[id] || 0),
      0
    );

    let status: "mastered" | "practiced" | "needs_review" = "practiced";

    if (relatedCompleted.length === concept.levelIds.length && relatedFails <= 2) {
      status = "mastered";
    } else if (relatedFails >= 4) {
      status = "needs_review";
    } else if (relatedCompleted.length > 0) {
      status = "practiced";
    }

    return {
      ...concept,
      status,
    };
  });

  // Suggested reviews based on actual error frequencies and difficulty levels
  const suggestedReviews: LearningInsightsData["suggestedReviews"] = [];

  // Check collision issues
  const collisionCount = (errorHistory["COLLISION_WALL"] || 0) + (errorHistory["COLLISION_OBSTACLE"] || 0);
  if (collisionCount >= 2 || (failedAttemptsByLevel[2] || 0) >= 3 || (failedAttemptsByLevel[3] || 0) >= 3) {
    suggestedReviews.push({
      topic: "Menghitung Batas Lintasan & Iterasi FOR",
      reason: "Terdeteksi beberapa kali robot menabrak pembatas arena karena jumlah perulangan melebihi panjang petak.",
      recommendedLevelId: 2,
    });
  }

  // Check while loop issues
  const whileFails = (failedAttemptsByLevel[4] || 0) + (failedAttemptsByLevel[6] || 0);
  if (whileFails >= 3 || errorHistory["LOOP_CONDITION_PREVENTS_ACTION"]) {
    suggestedReviews.push({
      topic: "Kondisi Berhenti pada Loop WHILE",
      reason: "Memahami kapan sensor `pathClear()` bernilai FALSE dan di mana menempatkan instruksi penutup.",
      recommendedLevelId: 4,
    });
  }

  // Check battery missing action issues
  if ((errorHistory["BATTERY_MISSING_ACTION"] || 0) >= 2 || (errorHistory["BATTERY_WRONG_POSITION"] || 0) >= 2) {
    suggestedReviews.push({
      topic: "Sinkronisasi Balok AMBIL BATERAI",
      reason: "Pastikan posisi robot tepat di atas koordinat baterai sebelum instruksi `collect()` dipanggil.",
      recommendedLevelId: 1,
    });
  }

  // If no specific struggles yet, suggest advancing to next uncompleted level
  if (suggestedReviews.length === 0) {
    const nextUncompleted = levels.find((lvl) => !uniqueCompleted.includes(lvl.id));
    if (nextUncompleted) {
      suggestedReviews.push({
        topic: `Tantangan Baru: ${nextUncompleted.name}`,
        reason: `Lanjutkan petualangan dengan menyelesaikan Level ${nextUncompleted.id} (${nextUncompleted.focus}).`,
        recommendedLevelId: nextUncompleted.id,
      });
    } else {
      suggestedReviews.push({
        topic: "Pengayaan: Optimasi Efisiensi Balok",
        reason: "Semua 8 level telah selesai! Coba selesaikan kembali dengan jumlah balok paling minimal (efisien).",
        recommendedLevelId: 8,
      });
    }
  }

  return {
    completedCount,
    totalLevels,
    completionPercentage,
    learningStage,
    totalAttempts,
    failedAttemptsTotal,
    attemptsByLevel,
    hintsUnlockedTotal,
    hintsUsedByLevel,
    conceptsPracticed,
    errorCategoryCounts: errorHistory,
    suggestedReviews,
  };
}
