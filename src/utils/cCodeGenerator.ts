import { CodeBlock } from "../types";

/**
 * Translates visual code blocks into clean C language code.
 */
export function generateCCode(blocks: CodeBlock[], indentLevel = 1): string {
  const indent = "    ".repeat(indentLevel);
  const lines: string[] = [];

  for (const block of blocks) {
    if (block.type === "command") {
      switch (block.action) {
        case "move_forward":
          lines.push(`${indent}move();`);
          break;
        case "move_backward":
          lines.push(`${indent}moveBackward();`);
          break;
        case "turn_left":
          lines.push(`${indent}turnLeft();`);
          break;
        case "turn_right":
          lines.push(`${indent}turnRight();`);
          break;
        case "take_battery":
          lines.push(`${indent}collect();`);
          break;
        case "wait":
          lines.push(`${indent}wait();`);
          break;
        case "jump":
          lines.push(`${indent}jump();`);
          break;
      }
    } else if (block.type === "repeat") {
      const varName = block.variable || (indentLevel === 1 ? "i" : indentLevel === 2 ? "j" : "k");
      const start = block.startVal ?? 0;
      const count = block.count ?? 3;
      const op = block.conditionOp || "<";
      let stepStr = `${varName}++`;
      if (block.stepOp === "+=2") stepStr = `${varName} += 2`;
      else if (block.stepOp === "+=3") stepStr = `${varName} += 3`;
      else if (block.stepOp === "--") stepStr = `${varName}--`;
      else if (block.stepOp === "-=2") stepStr = `${varName} -= 2`;
      else if (block.stepOp === "none") stepStr = `/* no step */`;

      lines.push(`${indent}for (int ${varName} = ${start}; ${varName} ${op} ${count}; ${stepStr}) {`);
      if (block.commands && block.commands.length > 0) {
        lines.push(generateCCode(block.commands, indentLevel + 1));
      } else {
        lines.push(`${indent}    // body kosong`);
      }
      lines.push(`${indent}}`);
    } else if (block.type === "while") {
      if (block.whileMode === "counter") {
        const varName = block.counterVar || "x";
        const startVal = block.startVal ?? 5;
        const op = block.conditionOp || ">";
        const targetVal = block.targetVal ?? 2;
        let stepStatement = `${varName}--;`;
        if (block.stepOp === "--") stepStatement = `${varName}--;`;
        else if (block.stepOp === "-=2") stepStatement = `${varName} -= 2;`;
        else if (block.stepOp === "++") stepStatement = `${varName}++;`;
        else if (block.stepOp === "+=2") stepStatement = `${varName} += 2;`;
        else if (block.stepOp === "+=3") stepStatement = `${varName} += 3;`;
        else if (block.stepOp === "none") stepStatement = `// peringatan: ${varName} tidak berubah (potensi infinite loop)`;

        lines.push(`${indent}int ${varName} = ${startVal};`);
        lines.push(`${indent}while (${varName} ${op} ${targetVal}) {`);
        if (block.commands && block.commands.length > 0) {
          lines.push(generateCCode(block.commands, indentLevel + 1));
        }
        lines.push(`${indent}    ${stepStatement}`);
        lines.push(`${indent}}`);
      } else {
        let condStr = "pathClear()";
        if (block.condition === "has_battery") condStr = "hasBattery()";
        else if (block.condition === "not_at_target") condStr = "!atTarget()";
        else if (block.condition === "energy_gt_zero") condStr = "energy > 0";

        lines.push(`${indent}while (${condStr}) {`);
        if (block.commands && block.commands.length > 0) {
          lines.push(generateCCode(block.commands, indentLevel + 1));
        } else {
          lines.push(`${indent}    // body kosong`);
        }
        lines.push(`${indent}}`);
      }
    } else if (block.type === "do_while") {
      let condStr = "pathClear()";
      if (block.condition === "has_battery") condStr = "hasBattery()";
      else if (block.condition === "not_at_target") condStr = "!atTarget()";

      lines.push(`${indent}do {`);
      if (block.commands && block.commands.length > 0) {
        lines.push(generateCCode(block.commands, indentLevel + 1));
      } else {
        lines.push(`${indent}    // body kosong`);
      }
      lines.push(`${indent}} while (${condStr});`);
    } else if (block.type === "break") {
      lines.push(`${indent}break;`);
    } else if (block.type === "continue") {
      lines.push(`${indent}continue;`);
    } else if (block.type === "if") {
      let condStr = "atTarget()";
      if (block.condition === "path_clear") condStr = "pathClear()";
      else if (block.condition === "has_battery") condStr = "hasBattery()";

      lines.push(`${indent}if (${condStr}) {`);
      if (block.commands && block.commands.length > 0) {
        lines.push(generateCCode(block.commands, indentLevel + 1));
      }
      lines.push(`${indent}}`);
    }
  }

  return lines.join("\n");
}

/**
 * Generates compact, user-facing solution code containing only the primary commands and loops.
 * Zero boilerplate, easily readable, and directly mapped to what the student composed.
 */
export function generateUserSolutionCode(blocks: CodeBlock[], indentLevel = 0): string {
  const indent = "  ".repeat(indentLevel);
  const lines: string[] = [];

  for (const block of blocks) {
    if (block.type === "command") {
      switch (block.action) {
        case "move_forward":
          lines.push(`${indent}MAJU;`);
          break;
        case "move_backward":
          lines.push(`${indent}MUNDUR;`);
          break;
        case "turn_left":
          lines.push(`${indent}KIRI;`);
          break;
        case "turn_right":
          lines.push(`${indent}KANAN;`);
          break;
        case "take_battery":
          lines.push(`${indent}AMBIL BATERAI;`);
          break;
        case "wait":
          lines.push(`${indent}TUNGGU;`);
          break;
      }
    } else if (block.type === "repeat") {
      const varName = block.variable || "i";
      const start = block.startVal ?? 0;
      const count = block.count ?? 3;
      const op = block.conditionOp || "<";
      let stepStr = `${varName}++`;
      if (block.stepOp === "+=2") stepStr = `${varName} += 2`;
      else if (block.stepOp === "+=3") stepStr = `${varName} += 3`;
      else if (block.stepOp === "--") stepStr = `${varName}--`;
      else if (block.stepOp === "-=2") stepStr = `${varName} -= 2`;

      lines.push(`${indent}for (int ${varName} = ${start}; ${varName} ${op} ${count}; ${stepStr}) {`);
      if (block.commands && block.commands.length > 0) {
        lines.push(generateUserSolutionCode(block.commands, indentLevel + 1));
      }
      lines.push(`${indent}}`);
    } else if (block.type === "while") {
      if (block.whileMode === "counter") {
        const varName = block.counterVar || "x";
        const startVal = block.startVal ?? 5;
        const op = block.conditionOp || ">";
        const targetVal = block.targetVal ?? 2;
        const stepOp = block.stepOp || "--";

        lines.push(`${indent}int ${varName} = ${startVal};`);
        lines.push(`${indent}while (${varName} ${op} ${targetVal}) {`);
        if (block.commands && block.commands.length > 0) {
          lines.push(generateUserSolutionCode(block.commands, indentLevel + 1));
        }
        lines.push(`${indent}  ${varName}${stepOp};`);
        lines.push(`${indent}}`);
      } else {
        let condStr = "pathClear()";
        if (block.condition === "has_battery") condStr = "hasBattery()";
        else if (block.condition === "not_at_target") condStr = "!atTarget()";

        lines.push(`${indent}while (${condStr}) {`);
        if (block.commands && block.commands.length > 0) {
          lines.push(generateUserSolutionCode(block.commands, indentLevel + 1));
        }
        lines.push(`${indent}}`);
      }
    } else if (block.type === "break") {
      lines.push(`${indent}break;`);
    } else if (block.type === "continue") {
      lines.push(`${indent}continue;`);
    }
  }

  return lines.join("\n");
}

/**
 * Returns a full C program with standard boilerplate.
 */
export function generateFullCProgram(blocks: CodeBlock[], levelTitle?: string): string {
  const body = generateCCode(blocks, 1);
  return `/* 
 * LOOPYU C Programming Game
 * ${levelTitle ? `Tantangan: ${levelTitle}` : "Solusi Perulangan"}
 * Pustaka pembantu gerakan robot didefinisikan dalam "loopyu_robot.h".
 */

#include <stdio.h>
#include "loopyu_robot.h"

int main() {
${body || "    // Masukkan balok kode untuk melihat kode C"}
    return 0;
}`;
}

import { CCodeLine, CCodeExplorerData } from "../types";

/**
 * Generates structured C code lines with 1-to-1 visual block ID mappings,
 * indentation levels, line types, and pedagogical explanations for junior high students.
 */
export function generateCCodeWithMapping(
  blocks: CodeBlock[],
  levelTitle?: string
): CCodeExplorerData {
  const lines: CCodeLine[] = [];
  const blockToLineMap: Record<string, number> = {};
  const loopElements: CCodeExplorerData["loopElements"] = [];

  let currentLineNum = 1;

  function addLine(
    text: string,
    indent: number,
    blockId?: string,
    type?: CCodeLine["type"],
    explanation?: CCodeLine["conceptExplanation"]
  ) {
    const lineObj: CCodeLine = {
      lineNumber: currentLineNum,
      text,
      indent,
      blockId,
      type,
      conceptExplanation: explanation,
    };
    lines.push(lineObj);
    if (blockId && !blockToLineMap[blockId]) {
      blockToLineMap[blockId] = currentLineNum;
    }
    currentLineNum++;
  }

  function processBlocks(list: CodeBlock[], indentLevel: number) {
    for (const block of list) {
      if (block.type === "command") {
        let cmdText = "move();";
        let title = "Melangkah Maju";
        let desc = "Fungsi move() menggerakkan robot maju 1 petak ke depan sesuai arah hadapnya.";

        switch (block.action) {
          case "move_forward":
            cmdText = "move();";
            title = "Melangkah Maju";
            desc = "Memanggil move() untuk melangkah 1 petak ke depan.";
            break;
          case "move_backward":
            cmdText = "moveBackward();";
            title = "Melangkah Mundur";
            desc = "Memanggil moveBackward() untuk mundur 1 petak ke belakang.";
            break;
          case "turn_left":
            cmdText = "turnLeft();";
            title = "Belok Kiri 90°";
            desc = "Memanggil turnLeft() untuk memutar haluan robot 90 derajat berlawanan jarum jam.";
            break;
          case "turn_right":
            cmdText = "turnRight();";
            title = "Belok Kanan 90°";
            desc = "Memanggil turnRight() untuk memutar haluan robot 90 derajat searah jarum jam.";
            break;
          case "take_battery":
            cmdText = "collect();";
            title = "Ambil Baterai";
            desc = "Memanggil collect() untuk memungut baterai di petak robot ke inventaris.";
            break;
          case "wait":
            cmdText = "wait();";
            title = "Tunggu";
            desc = "Menahan robot diam sejenak di posisinya.";
            break;
          case "jump":
            cmdText = "jump();";
            title = "Lompat";
            desc = "Melompat melintasi rintangan di depan.";
            break;
        }

        addLine(cmdText, indentLevel, block.id, "command", {
          title,
          description: desc,
          partName: "action",
        });
      } else if (block.type === "repeat") {
        const varName = block.variable || (indentLevel === 0 ? "i" : indentLevel === 1 ? "j" : "k");
        const start = block.startVal ?? 0;
        const count = block.count ?? 3;
        const op = block.conditionOp || "<";
        let stepStr = `${varName}++`;
        let stepDesc = `${varName}++ (Pembaruan: ${varName} bertambah 1 setiap akhir iterasi)`;
        if (block.stepOp === "+=2") {
          stepStr = `${varName} += 2`;
          stepDesc = `${varName} += 2 (Pola lompatan 2: mencacah kelipatan/genap)`;
        } else if (block.stepOp === "+=3") {
          stepStr = `${varName} += 3`;
          stepDesc = `${varName} += 3 (Pola lompatan 3: mencacah kelipatan 3)`;
        } else if (block.stepOp === "--") {
          stepStr = `${varName}--`;
          stepDesc = `${varName}-- (Hitungan mundur: ${varName} berkurang 1)`;
        } else if (block.stepOp === "-=2") {
          stepStr = `${varName} -= 2`;
          stepDesc = `${varName} -= 2 (Hitungan mundur lompat 2)`;
        } else if (block.stepOp === "none") {
          stepStr = `/* no step */`;
          stepDesc = `Pencacah tidak diperbarui (berisiko infinite loop)`;
        }

        const forHeader = `for (int ${varName} = ${start}; ${varName} ${op} ${count}; ${stepStr}) {`;
        addLine(forHeader, indentLevel, block.id, "for_header", {
          title: "Header Perulangan FOR",
          description: `Struktur perulangan terhitung: (1) Inisialisasi: int ${varName} = ${start}, (2) Kondisi uji: ${varName} ${op} ${count}, (3) Pembaruan: ${stepStr}.`,
          partName: "condition",
        });

        loopElements.push({
          loopType: "for",
          initialization: `int ${varName} = ${start} (Nilai awal)`,
          condition: `${varName} ${op} ${count} (Syarat lanjut loop)`,
          update: stepDesc,
          bodySummary: `Mengeksekusi instruksi di dalam kurung kurawal { ... } selama kondisi bernilai TRUE.`,
        });

        if (block.commands && block.commands.length > 0) {
          processBlocks(block.commands, indentLevel + 1);
        } else {
          addLine("// body loop kosong - masukkan balok perintah ke sini", indentLevel + 1, undefined, "empty_body", {
            title: "Badan Loop Kosong",
            description: "Wadah perulangan ini belum memiliki instruksi yang dieksekusi.",
            partName: "body",
          });
        }

        addLine("}", indentLevel, undefined, "block_close");
      } else if (block.type === "while") {
        if (block.whileMode === "counter") {
          const varName = block.counterVar || "x";
          const startVal = block.startVal ?? 5;
          const op = block.conditionOp || ">";
          const targetVal = block.targetVal ?? 2;
          const stepOp = block.stepOp || "--";

          addLine(`int ${varName} = ${startVal};`, indentLevel, block.id, "header", {
            title: "Inisialisasi Variabel Pencacah WHILE",
            description: `Mendeklarasikan variabel '${varName}' dengan nilai awal ${startVal} sebelum perulangan while dimulai.`,
            partName: "initialization",
          });

          addLine(`while (${varName} ${op} ${targetVal}) {`, indentLevel, block.id, "while_header", {
            title: "Header Perulangan WHILE (Kondisi Variabel)",
            description: `Perulangan berjalan selama kondisi (${varName} ${op} ${targetVal}) bernilai BENAR (TRUE), dan berhenti saat bernilai SALAH (FALSE).`,
            partName: "condition",
          });

          loopElements.push({
            loopType: "while",
            initialization: `int ${varName} = ${startVal}`,
            condition: `${varName} ${op} ${targetVal}`,
            update: `${varName}${stepOp} (perubahan nilai variabel)`,
            bodySummary: `Berulang selama ${varName} ${op} ${targetVal} bernilai TRUE.`,
          });

          if (block.commands && block.commands.length > 0) {
            processBlocks(block.commands, indentLevel + 1);
          } else {
            addLine("// body loop kosong", indentLevel + 1, undefined, "empty_body");
          }

          addLine(`${varName}${stepOp};`, indentLevel + 1, block.id, "command", {
            title: "Pembaruan Pencacah WHILE",
            description: `Mengubah nilai ${varName} dengan '${stepOp}' agar kondisi pada akhirnya bernilai FALSE sehingga loop berhenti secara teratur.`,
            partName: "action",
          });

          addLine("}", indentLevel, undefined, "block_close");
        } else {
          let condStr = "pathClear()";
          let condDesc = "pathClear() bernilai TRUE jika petak di depan aman tanpa pembatas/batu.";
          if (block.condition === "has_battery") {
            condStr = "hasBattery()";
            condDesc = "hasBattery() bernilai TRUE jika ada baterai di petak saat ini.";
          } else if (block.condition === "not_at_target") {
            condStr = "!atTarget()";
            condDesc = "!atTarget() bernilai TRUE jika masih ada baterai sasaran yang belum terkumpul.";
          } else if (block.condition === "energy_gt_zero") {
            condStr = "energy > 0";
            condDesc = "energy > 0 memeriksa sisa baterai robot.";
          }

          addLine(`while (${condStr}) {`, indentLevel, block.id, "while_header", {
            title: "Header Perulangan WHILE (Sensor)",
            description: `Perulangan berbasis sensor: memeriksa kondisi (${condStr}) sebelum tiap langkah. Selama TRUE, isi loop dieksekusi.`,
            partName: "condition",
          });

          loopElements.push({
            loopType: "while",
            condition: `${condStr} (${condDesc})`,
            bodySummary: "Terus berulang selama kondisi jalan aman (TRUE) dan berhenti saat terhalang (FALSE).",
          });

          if (block.commands && block.commands.length > 0) {
            processBlocks(block.commands, indentLevel + 1);
          } else {
            addLine("// body loop kosong - masukkan balok perintah ke sini", indentLevel + 1, undefined, "empty_body", {
              title: "Badan Loop Kosong",
              description: "Wadah perulangan ini belum memiliki instruksi yang dieksekusi.",
              partName: "body",
            });
          }

          addLine("}", indentLevel, undefined, "block_close");
        }
      } else if (block.type === "do_while") {
        addLine("do {", indentLevel, block.id, "do_while_header", {
          title: "Awal DO...WHILE",
          description: "Mengeksekusi isi loop minimal 1 kali terlebih dahulu sebelum memeriksa syarat.",
          partName: "body",
        });

        if (block.commands && block.commands.length > 0) {
          processBlocks(block.commands, indentLevel + 1);
        } else {
          addLine("// body loop kosong", indentLevel + 1, undefined, "empty_body");
        }

        let condStr = "pathClear()";
        if (block.condition === "has_battery") condStr = "hasBattery()";
        else if (block.condition === "not_at_target") condStr = "!atTarget()";

        addLine(`} while (${condStr});`, indentLevel, undefined, "condition", {
          title: "Kondisi Penutup DO...WHILE",
          description: `Pemeriksaan kondisi di akhir: ulangi jika ${condStr} bernilai TRUE.`,
          partName: "condition",
        });
      } else if (block.type === "break") {
        addLine("break;", indentLevel, block.id, "command", {
          title: "Pernyataan BREAK",
          description: "Menghentikan perulangan saat ini dan melompat keluar dari kurung loop.",
          partName: "action",
        });
      } else if (block.type === "continue") {
        addLine("continue;", indentLevel, block.id, "command", {
          title: "Pernyataan CONTINUE",
          description: "Melewatkan sisa baris pada putaran ini dan melompat ke putaran berikutnya.",
          partName: "action",
        });
      } else if (block.type === "if") {
        let condStr = "atTarget()";
        if (block.condition === "path_clear") condStr = "pathClear()";
        else if (block.condition === "has_battery") condStr = "hasBattery()";

        addLine(`if (${condStr}) {`, indentLevel, block.id, "condition", {
          title: "Percabangan IF",
          description: `Hanya dieksekusi jika kondisi ${condStr} bernilai TRUE.`,
          partName: "condition",
        });

        if (block.commands && block.commands.length > 0) {
          processBlocks(block.commands, indentLevel + 1);
        }

        addLine("}", indentLevel, undefined, "block_close");
      }
    }
  }

  processBlocks(blocks, 0);

  const rawSnippet = lines.map((l) => "    ".repeat(l.indent) + l.text).join("\n");
  const fullProgram = generateFullCProgram(blocks, levelTitle);

  return {
    rawCode: rawSnippet,
    fullProgram,
    lines,
    blockToLineMap,
    loopElements,
  };
}

