import { CodeBlock, LevelConfig, DiagnosticDiagnosis } from "../types";
import { EngineResult } from "./loopEngine";

/**
 * Pure diagnostic evaluator that inspects blocks, level configuration,
 * and authoritative simulation engine results to produce actionable,
 * pedagogical diagnosis for junior high school students.
 */
export function diagnoseSimulation(
  blocks: CodeBlock[],
  level: LevelConfig,
  result: EngineResult
): DiagnosticDiagnosis | null {
  // If simulation succeeded, no diagnosis needed
  if (result.success) {
    return null;
  }

  // 1. Check for empty program
  if (!blocks || blocks.length === 0) {
    return {
      code: "EMPTY_PROGRAM",
      severity: "warning",
      title: "Workspace Masih Kosong 📝",
      whatHappened: "Belum ada balok perintah atau perulangan yang disusun di workspace.",
      whyItMatters:
        "Robot Loopi membutuhkan instruksi bertahap untuk mengetahui ke mana harus melangkah dan apa yang harus dilakukan.",
      inspectBlock: "Panel Palet Balok (Kiri / Bawah)",
      actionableHint: "Tarik balok perintah seperti MAJU atau wadah perulangan FOR/WHILE ke workspace.",
      retrySuggestion: "Mulai susun balok pertamamu lalu tekan tombol 'Jalankan Program'.",
    };
  }

  // 2. Check for empty loop body
  const emptyLoop = findEmptyLoopBlock(blocks);
  if (emptyLoop) {
    const loopLabel = emptyLoop.type === "repeat" ? "FOR (Ulangi)" : "WHILE (Selama)";
    return {
      code: "EMPTY_LOOP_BODY",
      severity: "warning",
      title: `Wadah Loop ${loopLabel} Masih Kosong 📦`,
      whatHappened: `Kamu telah meletakkan balok ${loopLabel}, tetapi belum memasukkan perintah aksi di dalamnya.`,
      whyItMatters:
        "Dalam bahasa C, loop tanpa isi body `{ }` akan berputar tanpa mengerjakan apa pun (operasi kosong), sehingga robot diam di tempat.",
      inspectBlock: `Balok ${loopLabel}`,
      actionableHint:
        "Klik atau seret balok aksi (misal: MAJU atau AMBIL BATERAI) ke dalam wadah perulangan ini.",
      relatedBlockId: emptyLoop.id,
      retrySuggestion: "Masukkan minimal 1 perintah ke dalam wadah loop lalu jalankan kembali.",
    };
  }

  // 3. Infinite loop or safety limit reached
  if (result.infiniteLoop || result.steps.length >= 90) {
    return {
      code: "INFINITE_LOOP",
      severity: "error",
      title: "Perulangan Tanpa Henti (Infinite Loop) 🔄",
      whatHappened:
        "Program mencapai batas keamanan eksekusi (safety limit). Kondisi perulangan selalu bernilai BENAR (TRUE) dan tidak pernah berhenti.",
      whyItMatters:
        "Dalam pemrograman komputer, infinite loop dapat membekukan sistem dan menghabiskan memori karena program tidak memiliki titik akhir.",
      inspectBlock: "Kondisi perulangan WHILE atau batas FOR",
      actionableHint:
        "Pastikan ada instruksi di dalam loop yang membawa robot mendekati kondisi berhenti (misal: melangkah hingga mendekati dinding/target).",
      retrySuggestion: "Periksa kembali balok di dalam loop dan pastikan kondisi berhenti dapat tercapai.",
    };
  }

  // 4. Collision (Wall or Obstacle)
  if (result.crashed) {
    const lastStep = result.steps[result.steps.length - 1];
    const isObstacle = level.obstacles?.some((obs) => {
      if (!lastStep) return false;
      return obs.x === lastStep.robotPos.x && obs.y === lastStep.robotPos.y;
    });

    // Check if the crash happened because a repeat loop had too many iterations
    const parentLoop = lastStep?.parentLoopId
      ? findBlockById(blocks, lastStep.parentLoopId)
      : null;

    if (
      parentLoop &&
      parentLoop.type === "repeat" &&
      level.expectedIterations &&
      parentLoop.count > level.expectedIterations
    ) {
      return {
        code: "LOOP_ITERATION_EXCESSIVE",
        severity: "error",
        title: "Putaran Loop Terlalu Banyak! 🛑",
        whatHappened: `Balok FOR berputar ${parentLoop.count} kali, melebihi lintasan aman sehingga robot menabrak batas arena pada putaran ke-${lastStep.iteration || parentLoop.count}.`,
        whyItMatters:
          "Dalam bahasa C, perulangan `for (int i = 0; i < N; i++)` harus memiliki batas nilai N yang tepat agar array atau batas lintasan tidak terlampaui.",
        inspectBlock: `Balok FOR (repeat ${parentLoop.count}x)`,
        actionableHint: `Kurangi angka perulangan pada balok FOR menjadi ${level.expectedIterations} kali.`,
        relatedBlockId: parentLoop.id,
        retrySuggestion: "Ubah angka pengulangan lalu klik 'Jalankan Program' kembali.",
      };
    }

    return {
      code: isObstacle ? "COLLISION_OBSTACLE" : "COLLISION_WALL",
      severity: "error",
      title: isObstacle ? "Robot Menabrak Rintangan! 💥" : "Robot Menabrak Pembatas Arena! 🚧",
      whatHappened:
        lastStep?.crashReason ||
        "Robot melangkah ke petak di luar batas arena atau terhalang rintangan batu.",
      whyItMatters:
        "Robot harus selalu berada di jalur yang aman. Tabrakan menyebabkan sensor robot rusak dan program dihentikan seketika.",
      inspectBlock: lastStep?.blockId ? `Balok perintah aksi terakhir` : "Rangkaian langkah MAJU",
      actionableHint:
        "Hitung kembali jumlah langkah petak lintasan sebelum dinding, atau gunakan belokan KIRI/KANAN.",
      relatedBlockId: lastStep?.blockId,
      retrySuggestion: "Sesuaikan jumlah langkah maju atau arah hadap robot sebelum dinding.",
    };
  }

  // 5. Missing Take Battery action in the entire program
  if (!result.hasTakeBatteryCommand || result.takeBatteryExecutedCount === 0) {
    return {
      code: "BATTERY_MISSING_ACTION",
      severity: "warning",
      title: "Baterai Belum Diambil: Balok 'AMBIL BATERAI' Tidak Ditemukan 🔋",
      whatHappened:
        "Robot telah melangkah di arena, namun program tidak memuat atau tidak pernah mengeksekusi balok 'AMBIL BATERAI'.",
      whyItMatters:
        "Tujuan misi utama adalah mengumpulkan baterai ke penyimpanan robot. Berada di atas petak baterai saja tidak otomatis mengambilnya—kamu harus memanggil fungsi `collect()`!",
      inspectBlock: "Tambahkan balok 'AMBIL BATERAI'",
      actionableHint:
        "Tarik balok 'AMBIL BATERAI' dari palet dan tempatkan di dalam alur program atau di dalam wadah perulangan.",
      retrySuggestion: "Tambahkan balok 'AMBIL BATERAI' lalu jalankan ulang program.",
    };
  }

  // 6. Invalid battery pickup: 'take_battery' executed on empty tile
  if (result.invalidBatteryPickupCount > 0) {
    const invalidStep = result.steps.find((s) => s.isInvalidBatteryPickup);
    return {
      code: "BATTERY_WRONG_POSITION",
      severity: "warning",
      title: "Posisi Pengambilan Baterai Meleset! ⚠️",
      whatHappened: `Robot menjalankan balok 'AMBIL BATERAI' pada petak koordinat (${invalidStep?.robotPos.x ?? "?"}, ${invalidStep?.robotPos.y ?? "?"}) yang ternyata kosong tanpa baterai.`,
      whyItMatters:
        "Dalam bahasa C dan sistem robotika nyata, memanggil fungsi `collect()` pada slot kosong adalah operasi sia-sia (invalid pickup) dan menggagalkan misi.",
      inspectBlock: "Balok 'AMBIL BATERAI'",
      actionableHint:
        "Pastikan robot sudah bergerak tepat di atas petak baterai terlebih dahulu sebelum memanggil 'AMBIL BATERAI'.",
      relatedBlockId: invalidStep?.blockId,
      retrySuggestion: "Periksa urutan: apakah robot harus MAJU terlebih dahulu sebelum AMBIL BATERAI?",
    };
  }

  // 7. Uncollected batteries
  if (result.collectedBatteryIds.length < level.targetBatteries.length) {
    const uncollectedCount = level.targetBatteries.length - result.collectedBatteryIds.length;
    const remainingBatteries = level.targetBatteries.filter(
      (b) => !result.collectedBatteryIds.includes(b.id)
    );
    const coordsStr = remainingBatteries.map((b) => `(${b.x}, ${b.y})`).join(", ");

    // Check if a repeat loop was too short
    const firstRepeat = findFirstBlockOfType(blocks, "repeat");
    if (firstRepeat && level.expectedIterations && firstRepeat.count < level.expectedIterations) {
      return {
        code: "LOOP_ITERATION_INSUFFICIENT",
        severity: "warning",
        title: "Putaran Loop Kurang Banyak 🔄",
        whatHappened: `Balok FOR hanya berputar ${firstRepeat.count} kali, sehingga robot berhenti sebelum menjangkau seluruh ${level.targetBatteries.length} baterai.`,
        whyItMatters:
          `Dalam bahasa C, jika kondisi batas perulangan 'i < ${firstRepeat.count}' terlalu kecil, proses iterasi berhenti lebih dini sebelum semua target terambil.`,
        inspectBlock: `Balok FOR (repeat ${firstRepeat.count}x)`,
        actionableHint: `Tingkatkan angka perulangan pada balok FOR menjadi ${level.expectedIterations} kali.`,
        relatedBlockId: firstRepeat.id,
        retrySuggestion: "Ubah angka pengulangan lalu uji kembali robotmu.",
      };
    }

    // Check if a while loop stopped before collecting all
    const firstWhile = findFirstBlockOfType(blocks, "while");
    if (firstWhile && firstWhile.condition === "path_clear") {
      return {
        code: "LOOP_CONDITION_PREVENTS_ACTION",
        severity: "warning",
        title: "Loop WHILE Berhenti Sebelum Selesai 🛑",
        whatHappened: `Kondisi 'while (pathClear())' menjadi FALSE saat robot tiba di depan dinding, namun masih ada ${uncollectedCount} baterai di posisi ${coordsStr} yang belum dipungut.`,
        whyItMatters:
          "Loop WHILE berhenti segera setelah kondisinya bernilai FALSE. Instruksi pengambilan baterai di akhir lintasan harus diletakkan setelah loop selesai.",
        inspectBlock: "Letak balok 'AMBIL BATERAI' setelah loop WHILE",
        actionableHint:
          "Letakkan balok 'AMBIL BATERAI' tepat di bawah wadah loop WHILE agar dieksekusi setelah robot berhenti di depan dinding.",
        relatedBlockId: firstWhile.id,
        retrySuggestion: "Letakkan balok AMBIL BATERAI di luar/bawah wadah loop WHILE.",
      };
    }

    return {
      code: "BATTERY_UNCOLLECTED",
      severity: "warning",
      title: "Sebagian Baterai Belum Terkumpul 🔋",
      whatHappened: `Masih ada ${uncollectedCount} dari ${level.targetBatteries.length} baterai yang belum diambil pada koordinat ${coordsStr}.`,
      whyItMatters:
        "Misi hanya dianggap berhasil jika semua target baterai di arena berhasil dikumpulkan.",
      inspectBlock: "Alur pergerakan dan pengambilan baterai",
      actionableHint:
        "Periksa apakah robot melewati seluruh titik sasaran dan mengeksekusi 'AMBIL BATERAI' di tiap titik.",
      retrySuggestion: "Pastikan robot mengunjungi setiap sasaran dan memungut baterai di sana.",
    };
  }

  // 8. Concept mismatch (required loop type not used)
  if (!result.conceptValid) {
    return {
      code: "CONCEPT_MISMATCH",
      severity: "warning",
      title: "Konsep Perulangan Belum Sesuai 💡",
      whatHappened:
        result.conceptFeedback ||
        "Program belum menggunakan jenis balok perulangan yang menjadi target pembelajaran level ini.",
      whyItMatters:
        "Setiap level dirancang untuk melatih pemahaman konsep spesifik (misal: loop FOR untuk jumlah langkah pasti, loop WHILE untuk kondisi jalan aman).",
      inspectBlock: "Gunakan balok perulangan yang sesuai",
      actionableHint:
        level.requiredLoopType === "for"
          ? "Gunakan balok perulangan FOR (Ulangi) agar langkah robot otomatis berulang."
          : level.requiredLoopType === "while"
          ? "Gunakan balok perulangan WHILE (Selama jalan aman) pada level ini."
          : "Gunakan balok perulangan yang diinstruksikan pada fokus level.",
      retrySuggestion: "Ganti instruksi manual dengan balok perulangan yang diminta.",
    };
  }

  // 9. Neutral fallback for uncertain cases
  return {
    code: "UNKNOWN_FAILURE",
    severity: "info",
    title: "Program Belum Berhasil Menyelesaikan Misi 🔍",
    whatHappened: "Robot belum dapat menyelesaikan seluruh kriteria kelulusan level ini.",
    whyItMatters:
      "Dalam pemrograman, melakukan debugging langkah demi langkah adalah bagian alami dari proses belajar.",
    inspectBlock: "Rangkaian balok di workspace",
    actionableHint:
      "Gunakan tombol 'Langkah' (Step) untuk melihat robot bergerak satu per satu dan amati di mana letak ketidaksesuaiannya.",
    retrySuggestion: "Periksa kembali instruksi misi dan coba susun ulang langkahmu.",
  };
}

// Helper utilities for block inspection
function findEmptyLoopBlock(blocks: CodeBlock[]): CodeBlock | null {
  for (const b of blocks) {
    if (
      (b.type === "repeat" || b.type === "while" || b.type === "do_while") &&
      (!b.commands || b.commands.length === 0)
    ) {
      return b;
    }
    if (
      (b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") &&
      b.commands
    ) {
      const inner = findEmptyLoopBlock(b.commands);
      if (inner) return inner;
    }
  }
  return null;
}

function findBlockById(blocks: CodeBlock[], id: string): CodeBlock | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (
      (b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") &&
      b.commands
    ) {
      const found = findBlockById(b.commands, id);
      if (found) return found;
    }
  }
  return null;
}

function findFirstBlockOfType(blocks: CodeBlock[], type: string): any {
  for (const b of blocks) {
    if (b.type === type) return b;
    if (
      (b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") &&
      b.commands
    ) {
      const found = findFirstBlockOfType(b.commands, type);
      if (found) return found;
    }
  }
  return null;
}
