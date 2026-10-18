import { CodeBlock, Direction, LevelConfig, IterationTrace } from "../types";

export interface ExecutionStep {
  stepIndex: number;
  blockId: string;
  parentLoopId?: string;
  loopType?: "for" | "while" | "do_while";
  iteration?: number;
  totalIterations?: number;
  conditionText?: string;
  action: string;
  robotPos: { x: number; y: number; dir: Direction };
  collectedBatteryIds: string[];
  isCrashed?: boolean;
  crashReason?: string;
  isInfiniteLoop?: boolean;
  batteryPickedUpId?: string;
  isInvalidBatteryPickup?: boolean;
  iterationTrace?: IterationTrace;
}

export interface EngineResult {
  steps: ExecutionStep[];
  success: boolean;
  crashed: boolean;
  infiniteLoop: boolean;
  crashReason?: string;
  collectedBatteryIds: string[];
  totalBatteries: number;
  usedLoop: boolean;
  loopTypesUsed: ("for" | "while" | "do_while")[];
  conceptValid: boolean;
  conceptFeedback?: string;
  totalBlocksUsed: number;
  isEfficient: boolean;
  hasTakeBatteryCommand: boolean;
  takeBatteryExecutedCount: number;
  invalidBatteryPickupCount: number;
  usedBatteryAtWrongPosition: boolean;
  iterationTraces: IterationTrace[];
}

export function containsTakeBatteryAction(blocks: CodeBlock[]): boolean {
  for (const b of blocks) {
    if (b.type === "command" && b.action === "take_battery") return true;
    if ((b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") && b.commands) {
      if (containsTakeBatteryAction(b.commands)) return true;
    }
  }
  return false;
}

export const DIRECTIONS_ORDER: Direction[] = ["right", "down", "left", "up"];

export function turnRobot(currDir: Direction, turnDir: "left" | "right"): Direction {
  const idx = DIRECTIONS_ORDER.indexOf(currDir);
  if (turnDir === "right") {
    return DIRECTIONS_ORDER[(idx + 1) % 4];
  } else {
    return DIRECTIONS_ORDER[(idx + 3) % 4];
  }
}

export function getNextCoordinates(x: number, y: number, dir: Direction): { x: number; y: number } {
  switch (dir) {
    case "right":
      return { x: x + 1, y };
    case "left":
      return { x: x - 1, y };
    case "up":
      return { x, y: y - 1 };
    case "down":
      return { x, y: y + 1 };
  }
}

export function getPreviousCoordinates(x: number, y: number, dir: Direction): { x: number; y: number } {
  switch (dir) {
    case "right":
      return { x: x - 1, y };
    case "left":
      return { x: x + 1, y };
    case "up":
      return { x, y: y + 1 };
    case "down":
      return { x, y: y - 1 };
  }
}

export function isBlocked(x: number, y: number, level: LevelConfig): boolean {
  if (x < 0 || x >= level.gridSize.cols || y < 0 || y >= level.gridSize.rows) {
    return true;
  }
  if (level.obstacles?.some((obs) => obs.x === x && obs.y === y)) {
    return true;
  }
  return false;
}

export function countTotalBlocks(blocks: CodeBlock[]): number {
  let count = 0;
  for (const b of blocks) {
    count++;
    if (b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") {
      count += countTotalBlocks(b.commands);
    }
  }
  return count;
}

/**
 * Executes a program and produces an array of detailed animation steps with loop iteration tracking.
 */
export function simulateLoopProgram(blocks: CodeBlock[], level: LevelConfig): EngineResult {
  const steps: ExecutionStep[] = [];
  const allIterationTraces: IterationTrace[] = [];
  let curX = level.startPos.x;
  let curY = level.startPos.y;
  let curDir = level.startPos.dir;
  const collected = new Set<string>();

  let isCrashed = false;
  let crashReason = "";
  let isInfiniteLoop = false;
  const loopTypesUsed = new Set<"for" | "while" | "do_while">();

  const hasTakeBattery = containsTakeBatteryAction(blocks);
  let takeBatteryExecutedCount = 0;
  let invalidBatteryPickupCount = 0;

  const MAX_TOTAL_STEPS = 90;
  const MAX_LOOP_ITERATIONS = 40;

  function evalCondition(
    condition?: "counter" | "path_clear" | "has_battery" | "not_at_target" | "energy_gt_zero" | string
  ): boolean {
    if (!condition) return false;
    if (condition === "path_clear") {
      const next = getNextCoordinates(curX, curY, curDir);
      return !isBlocked(next.x, next.y, level);
    }
    if (condition === "has_battery") {
      return level.targetBatteries.some((b) => b.x === curX && b.y === curY && !collected.has(b.id));
    }
    if (condition === "not_at_target") {
      return collected.size < level.targetBatteries.length;
    }
    if (condition === "energy_gt_zero" || condition === "counter") {
      return true;
    }
    return false;
  }

  // Recursive block executor
  function executeBlockList(
    subList: CodeBlock[],
    parentLoop?: {
      id: string;
      type: "for" | "while" | "do_while";
      iteration: number;
      total: number;
      conditionText?: string;
      iterationTrace?: IterationTrace;
    }
  ): "break" | "continue" | "normal" {
    for (const block of subList) {
      if (steps.length >= MAX_TOTAL_STEPS) {
        isInfiniteLoop = true;
        return "normal";
      }
      if (isCrashed || isInfiniteLoop) return "normal";

      if (block.type === "command") {
        if (block.action === "move_forward") {
          const next = getNextCoordinates(curX, curY, curDir);
          if (isBlocked(next.x, next.y, level)) {
            isCrashed = true;
            crashReason = "Robot menabrak pembatas arena atau rintangan. Coba periksa urutan blokmu.";
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "move_forward",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
              isCrashed: true,
              crashReason,
            });
            return "normal";
          } else {
            curX = next.x;
            curY = next.y;

            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "move_forward",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
            });
          }
        } else if (block.action === "move_backward") {
          const prev = getPreviousCoordinates(curX, curY, curDir);
          if (isBlocked(prev.x, prev.y, level)) {
            isCrashed = true;
            crashReason = "Robot menabrak pembatas arena atau rintangan saat bergerak mundur.";
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "move_backward",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
              isCrashed: true,
              crashReason,
            });
            return "normal";
          } else {
            curX = prev.x;
            curY = prev.y;

            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "move_backward",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
            });
          }
        } else if (block.action === "turn_left") {
          curDir = turnRobot(curDir, "left");
          steps.push({
            stepIndex: steps.length + 1,
            blockId: block.id,
            parentLoopId: parentLoop?.id,
            loopType: parentLoop?.type,
            iteration: parentLoop?.iteration,
            totalIterations: parentLoop?.total,
            conditionText: parentLoop?.conditionText,
            action: "turn_left",
            robotPos: { x: curX, y: curY, dir: curDir },
            collectedBatteryIds: Array.from(collected),
          });
        } else if (block.action === "turn_right") {
          curDir = turnRobot(curDir, "right");
          steps.push({
            stepIndex: steps.length + 1,
            blockId: block.id,
            parentLoopId: parentLoop?.id,
            loopType: parentLoop?.type,
            iteration: parentLoop?.iteration,
            totalIterations: parentLoop?.total,
            conditionText: parentLoop?.conditionText,
            action: "turn_right",
            robotPos: { x: curX, y: curY, dir: curDir },
            collectedBatteryIds: Array.from(collected),
          });
        } else if (block.action === "take_battery") {
          takeBatteryExecutedCount++;
          const found = level.targetBatteries.find(
            (b) => b.x === curX && b.y === curY && !collected.has(b.id)
          );
          if (found) {
            collected.add(found.id);
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "take_battery",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
              batteryPickedUpId: found.id,
            });
          } else {
            invalidBatteryPickupCount++;
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: parentLoop?.id,
              loopType: parentLoop?.type,
              iteration: parentLoop?.iteration,
              totalIterations: parentLoop?.total,
              conditionText: parentLoop?.conditionText,
              action: "take_battery",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
              isInvalidBatteryPickup: true,
            });
          }
        } else if (block.action === "wait") {
          steps.push({
            stepIndex: steps.length + 1,
            blockId: block.id,
            parentLoopId: parentLoop?.id,
            loopType: parentLoop?.type,
            iteration: parentLoop?.iteration,
            totalIterations: parentLoop?.total,
            conditionText: parentLoop?.conditionText,
            action: "wait",
            robotPos: { x: curX, y: curY, dir: curDir },
            collectedBatteryIds: Array.from(collected),
          });
        }
      } else if (block.type === "repeat") {
        loopTypesUsed.add("for");
        const varName = block.variable || "i";
        const startVal = typeof block.startVal === "number" ? block.startVal : 0;
        const conditionOp = block.conditionOp || "<";
        const targetCount = typeof block.count === "number" ? block.count : 3;
        const stepOp = block.stepOp || "++";

        const evalForCondition = (v: number): boolean => {
          switch (conditionOp) {
            case "<": return v < targetCount;
            case "<=": return v <= targetCount;
            case ">": return v > targetCount;
            case ">=": return v >= targetCount;
            case "!=": return v !== targetCount;
            default: return v < targetCount;
          }
        };

        const applyForStep = (v: number): number => {
          switch (stepOp) {
            case "++": return v + 1;
            case "+=2": return v + 2;
            case "+=3": return v + 3;
            case "--": return v - 1;
            case "-=2": return v - 2;
            case "none": return v;
            default: return v + 1;
          }
        };

        let currentVarVal = startVal;
        let iterCount = 0;

        // Trace initial condition check
        const initCondValid = evalForCondition(currentVarVal);
        if (!initCondValid) {
          const bypassTrace: IterationTrace = {
            variableName: varName,
            variableValue: currentVarVal,
            conditionExpr: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetCount}`,
            conditionResult: false,
            stepExpr: stepOp,
            actionName: "LOOP_BYPASS",
            explanation: `Nilai awal ${varName} = ${currentVarVal}. Kondisi ${varName} ${conditionOp} ${targetCount} langsung bernilai SALAH (FALSE) sehingga perulangan for dilewati!`,
            isLoopExit: true,
          };
          allIterationTraces.push(bypassTrace);
          steps.push({
            stepIndex: steps.length + 1,
            blockId: block.id,
            parentLoopId: block.id,
            loopType: "for",
            iteration: 0,
            totalIterations: 0,
            conditionText: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetCount} (FALSE ✕)`,
            action: "wait",
            robotPos: { x: curX, y: curY, dir: curDir },
            collectedBatteryIds: Array.from(collected),
            iterationTrace: bypassTrace,
          });
        }

        while (evalForCondition(currentVarVal) && iterCount < MAX_LOOP_ITERATIONS) {
          iterCount++;
          if (steps.length >= MAX_TOTAL_STEPS || isCrashed) break;

          const condText = `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetCount} ✓ TRUE`;
          const traceDetail: IterationTrace = {
            variableName: varName,
            variableValue: currentVarVal,
            conditionExpr: `${varName} ${conditionOp} ${targetCount}`,
            conditionResult: true,
            stepExpr: `${varName}${stepOp}`,
            actionName: "FOR_EXECUTE",
            explanation: `Iterasi ke-${iterCount}: ${varName} = ${currentVarVal}. Kondisi ${currentVarVal} ${conditionOp} ${targetCount} BENAR (TRUE). Blok perintah di dalam for dijalankan.`,
          };
          allIterationTraces.push(traceDetail);

          const res = executeBlockList(block.commands, {
            id: block.id,
            type: "for",
            iteration: iterCount,
            total: targetCount,
            conditionText: condText,
            iterationTrace: traceDetail,
          });

          if (res === "break") break;

          const nextVal = applyForStep(currentVarVal);
          traceDetail.stepExpr = `${varName} berubah dari ${currentVarVal} menjadi ${nextVal} via ${stepOp}`;
          currentVarVal = nextVal;
        }

        if (iterCount >= MAX_LOOP_ITERATIONS) {
          isInfiniteLoop = true;
          if (stepOp === "none") {
            crashReason = `Terdeteksi Infinite Loop: variabel ${varName} tidak pernah berubah (tidak ada increment/decrement).`;
          } else if (
            (conditionOp === "<=" || conditionOp === "<") &&
            (stepOp === "--" || stepOp === "-=2")
          ) {
            crashReason = `Terdeteksi Infinite Loop: variabel ${varName} terus berkurang (${stepOp}) saat kondisi ${varName} ${conditionOp} ${targetCount}, sehingga kondisi selalu bernilai TRUE!`;
          } else if (
            (conditionOp === ">=" || conditionOp === ">") &&
            (stepOp === "++" || stepOp === "+=2" || stepOp === "+=3")
          ) {
            crashReason = `Terdeteksi Infinite Loop: variabel ${varName} terus bertambah (${stepOp}) saat kondisi ${varName} ${conditionOp} ${targetCount}, sehingga perulangan tidak pernah berhenti!`;
          } else {
            crashReason = `Terdeteksi Infinite Loop: perulangan for melebihi batas aman ${MAX_LOOP_ITERATIONS} iterasi.`;
          }
        } else if (initCondValid && !isCrashed) {
          const exitTrace: IterationTrace = {
            variableName: varName,
            variableValue: currentVarVal,
            conditionExpr: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetCount}`,
            conditionResult: false,
            stepExpr: `${varName} = ${currentVarVal}`,
            actionName: "LOOP_EXIT",
            explanation: `Saat ${varName} mencapai nilai ${currentVarVal}, kondisi ${currentVarVal} ${conditionOp} ${targetCount} bernilai SALAH (FALSE). Perulangan for berhenti secara normal.`,
            isLoopExit: true,
          };
          allIterationTraces.push(exitTrace);
          steps.push({
            stepIndex: steps.length + 1,
            blockId: block.id,
            parentLoopId: block.id,
            loopType: "for",
            iteration: iterCount,
            totalIterations: targetCount,
            conditionText: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetCount} (FALSE ✕) → LOOP STOPPED`,
            action: "wait",
            robotPos: { x: curX, y: curY, dir: curDir },
            collectedBatteryIds: Array.from(collected),
            iterationTrace: exitTrace,
          });
        }
      } else if (block.type === "while") {
        loopTypesUsed.add("while");
        let whileCount = 0;

        if (block.whileMode === "counter") {
          // Counter-based While Loop (e.g., int x = 5; while (x > 2) { x--; })
          const varName = block.counterVar || "x";
          let currentVarVal = typeof block.startVal === "number" ? block.startVal : 5;
          const conditionOp = block.conditionOp || ">";
          const targetVal = typeof block.targetVal === "number" ? block.targetVal : 2;
          const stepOp = block.stepOp || "--";

          const evalWhileCounterCondition = (v: number): boolean => {
            switch (conditionOp) {
              case ">": return v > targetVal;
              case ">=": return v >= targetVal;
              case "<": return v < targetVal;
              case "<=": return v <= targetVal;
              case "!=": return v !== targetVal;
              default: return v > targetVal;
            }
          };

          const applyWhileStep = (v: number): number => {
            switch (stepOp) {
              case "--": return v - 1;
              case "-=2": return v - 2;
              case "++": return v + 1;
              case "+=2": return v + 2;
              case "+=3": return v + 3;
              case "none": return v;
              default: return v - 1;
            }
          };

          while (evalWhileCounterCondition(currentVarVal) && whileCount < MAX_LOOP_ITERATIONS) {
            whileCount++;
            if (steps.length >= MAX_TOTAL_STEPS || isCrashed) break;

            const condText = `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetVal} ✓ TRUE`;
            const traceDetail: IterationTrace = {
              variableName: varName,
              variableValue: currentVarVal,
              conditionExpr: `${varName} ${conditionOp} ${targetVal}`,
              conditionResult: true,
              stepExpr: `${varName}${stepOp}`,
              actionName: "WHILE_COUNTER_EXECUTE",
              explanation: `Iterasi while ke-${whileCount}: ${varName} = ${currentVarVal}. Kondisi ${currentVarVal} ${conditionOp} ${targetVal} BENAR (TRUE). Blok dijalankan.`,
            };
            allIterationTraces.push(traceDetail);

            const res = executeBlockList(block.commands, {
              id: block.id,
              type: "while",
              iteration: whileCount,
              total: 0,
              conditionText: condText,
              iterationTrace: traceDetail,
            });

            if (res === "break") break;

            const nextVal = applyWhileStep(currentVarVal);
            traceDetail.stepExpr = `${varName} berubah dari ${currentVarVal} menjadi ${nextVal} via ${stepOp}`;
            currentVarVal = nextVal;
          }

          if (whileCount >= MAX_LOOP_ITERATIONS) {
            isInfiniteLoop = true;
            if (stepOp === "none") {
              crashReason = `Terdeteksi Infinite Loop: variabel ${varName} pada while (${varName} ${conditionOp} ${targetVal}) tidak pernah berubah.`;
            } else if (
              (conditionOp === ">" || conditionOp === ">=") &&
              (stepOp === "++" || stepOp === "+=2" || stepOp === "+=3")
            ) {
              crashReason = `Terdeteksi Infinite Loop: variabel ${varName} terus bertambah sehingga kondisi ${varName} ${conditionOp} ${targetVal} selalu TRUE dan tidak pernah berhenti!`;
            } else if (
              (conditionOp === "<" || conditionOp === "<=") &&
              (stepOp === "--" || stepOp === "-=2")
            ) {
              crashReason = `Terdeteksi Infinite Loop: variabel ${varName} terus berkurang sehingga kondisi ${varName} ${conditionOp} ${targetVal} selalu TRUE!`;
            } else {
              crashReason = `Terdeteksi Infinite Loop: perulangan while melebihi batas aman ${MAX_LOOP_ITERATIONS} iterasi.`;
            }
          } else if (!isCrashed) {
            const exitTrace: IterationTrace = {
              variableName: varName,
              variableValue: currentVarVal,
              conditionExpr: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetVal}`,
              conditionResult: false,
              stepExpr: `${varName} = ${currentVarVal}`,
              actionName: "WHILE_EXIT",
              explanation: `Saat ${varName} bernilai ${currentVarVal}, kondisi ${currentVarVal} ${conditionOp} ${targetVal} bernilai SALAH (FALSE). Perulangan while berhenti secara normal.`,
              isLoopExit: true,
            };
            allIterationTraces.push(exitTrace);
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: block.id,
              loopType: "while",
              iteration: whileCount,
              totalIterations: 0,
              conditionText: `${varName} = ${currentVarVal}, ${varName} ${conditionOp} ${targetVal} (FALSE ✕) → WHILE STOPPED`,
              action: "wait",
              robotPos: { x: curX, y: curY, dir: curDir },
              collectedBatteryIds: Array.from(collected),
              iterationTrace: exitTrace,
            });
          }
        } else {
          // Sensor Mode (e.g., pathClear())
          while (evalCondition(block.condition) && whileCount < MAX_LOOP_ITERATIONS) {
            whileCount++;
            if (steps.length >= MAX_TOTAL_STEPS || isCrashed) break;
            const condName = block.condition === "path_clear" ? "pathClear()" : block.condition;
            const conditionText = `${condName} ✓ TRUE`;
            const traceDetail: IterationTrace = {
              variableName: "sensor",
              variableValue: whileCount,
              conditionExpr: `${condName} == TRUE`,
              conditionResult: true,
              stepExpr: `langkah ke-${whileCount}`,
              actionName: "WHILE_SENSOR_EXECUTE",
              explanation: `Iterasi while ke-${whileCount}: Kondisi sensor ${condName} bernilai TRUE (jalan di depan aman). Robot melanjutkan perintah di dalam loop.`,
            };
            allIterationTraces.push(traceDetail);

            const res = executeBlockList(block.commands, {
              id: block.id,
              type: "while",
              iteration: whileCount,
              total: 0,
              conditionText,
              iterationTrace: traceDetail,
            });
            if (res === "break") break;
          }

          if (whileCount >= MAX_LOOP_ITERATIONS) {
            isInfiniteLoop = true;
            crashReason = "Terdeteksi infinite loop: kondisi while selalu bernilai true.";
          } else if (!isCrashed && steps.length > 0) {
            const lastStep = steps[steps.length - 1];
            const sensorExitTrace: IterationTrace = {
              variableName: "sensor",
              variableValue: whileCount,
              conditionExpr: "pathClear() == FALSE",
              conditionResult: false,
              stepExpr: "berhenti di depan rintangan",
              actionName: "WHILE_SENSOR_EXIT",
              explanation: "Robot mendeteksi dinding/rintangan di depan (pathClear() bernilai FALSE). Perulangan while berhenti secara otomatis.",
              isLoopExit: true,
            };
            allIterationTraces.push(sensorExitTrace);
            steps.push({
              stepIndex: steps.length + 1,
              blockId: block.id,
              parentLoopId: block.id,
              loopType: "while",
              iteration: whileCount,
              totalIterations: 0,
              conditionText: "pathClear() ✕ FALSE → LOOP STOPPED",
              action: "wait",
              robotPos: { ...lastStep.robotPos },
              collectedBatteryIds: Array.from(collected),
              iterationTrace: sensorExitTrace,
            });
          }
        }
      } else if (block.type === "do_while") {
        loopTypesUsed.add("do_while");
        let doCount = 0;
        do {
          doCount++;
          if (steps.length >= MAX_TOTAL_STEPS || isCrashed) break;
          const conditionText = `do...while (Iterasi ${doCount})`;
          const res = executeBlockList(block.commands, {
            id: block.id,
            type: "do_while",
            iteration: doCount,
            total: 0,
            conditionText,
          });
          if (res === "break") break;
        } while (evalCondition(block.condition) && doCount < MAX_LOOP_ITERATIONS);

        if (doCount >= MAX_LOOP_ITERATIONS) {
          isInfiniteLoop = true;
          crashReason = "Terdeteksi infinite loop di do...while.";
        }
      } else if (block.type === "break") {
        steps.push({
          stepIndex: steps.length + 1,
          blockId: block.id,
          parentLoopId: parentLoop?.id,
          loopType: parentLoop?.type,
          iteration: parentLoop?.iteration,
          totalIterations: parentLoop?.total,
          conditionText: parentLoop?.conditionText,
          action: "break",
          robotPos: { x: curX, y: curY, dir: curDir },
          collectedBatteryIds: Array.from(collected),
        });
        return "break";
      } else if (block.type === "continue") {
        steps.push({
          stepIndex: steps.length + 1,
          blockId: block.id,
          parentLoopId: parentLoop?.id,
          loopType: parentLoop?.type,
          iteration: parentLoop?.iteration,
          totalIterations: parentLoop?.total,
          conditionText: parentLoop?.conditionText,
          action: "continue",
          robotPos: { x: curX, y: curY, dir: curDir },
          collectedBatteryIds: Array.from(collected),
        });
        return "continue";
      } else if (block.type === "if") {
        let condMet = false;
        if (block.condition === "at_target") {
          condMet = level.targetBatteries.some((b) => b.x === curX && b.y === curY);
        } else if (block.condition === "path_clear") {
          const next = getNextCoordinates(curX, curY, curDir);
          condMet = !isBlocked(next.x, next.y, level);
        } else if (block.condition === "has_battery") {
          condMet = level.targetBatteries.some((b) => b.x === curX && b.y === curY && !collected.has(b.id));
        }

        if (condMet) {
          const res = executeBlockList(block.commands, parentLoop);
          if (res === "break" || res === "continue") return res;
        }
      }
    }
    return "normal";
  }

  executeBlockList(blocks);

  const collectedArray = Array.from(collected);
  const totalBatteries = level.targetBatteries.length;
  const allCollected = collectedArray.length === totalBatteries;
  const totalBlocksUsed = countTotalBlocks(blocks);
  const usedLoop = loopTypesUsed.size > 0;
  const isEfficient = totalBlocksUsed <= level.maxBlocksForEfficiency;

  // Conceptual & Objective Validation
  let conceptValid = true;
  let conceptFeedback: string | undefined;

  // Strict check: if no take_battery command exists or executed at wrong spot
  if (!hasTakeBattery) {
    conceptValid = false;
    conceptFeedback = "❌ Level Gagal — Kamu belum memasukkan balok 'AMBIL BATERAI'!";
  } else if (takeBatteryExecutedCount === 0 && totalBatteries > 0) {
    conceptValid = false;
    conceptFeedback = "❌ Level Gagal — Kamu belum memasukkan balok 'AMBIL BATERAI' di posisi sasaran!";
  } else if (invalidBatteryPickupCount > 0) {
    conceptValid = false;
    conceptFeedback = "❌ Level Gagal — Balok 'AMBIL BATERAI' dijalankan saat robot berada di petak kosong tanpa baterai.";
  } else if (!allCollected) {
    conceptValid = false;
    const remaining = totalBatteries - collectedArray.length;
    conceptFeedback = `❌ Level Gagal — Masih ada ${remaining} dari ${totalBatteries} baterai yang belum diambil. Masukkan balok 'AMBIL BATERAI' di setiap sasaran.`;
  }

  if (conceptValid && level.requiredLoopType && level.requiredLoopType !== "none") {
    if (level.requiredLoopType === "for" && !loopTypesUsed.has("for")) {
      conceptValid = false;
      conceptFeedback = "❌ Level Gagal — Coba gunakan FOR pada level ini agar langkah robot berulang secara otomatis!";
    } else if (level.requiredLoopType === "while" && !loopTypesUsed.has("while")) {
      conceptValid = false;
      conceptFeedback = "❌ Level Gagal — Coba gunakan WHILE pada level ini agar robot berhenti sesuai kondisi jalan aman!";
    } else if (level.requiredLoopType === "do_while" && !loopTypesUsed.has("do_while")) {
      conceptValid = false;
      conceptFeedback = "❌ Level Gagal — Gunakan balok DO...WHILE untuk menyelesaikan level ini!";
    } else if (level.requiredLoopType === "any_loop" && !usedLoop) {
      conceptValid = false;
      conceptFeedback = "❌ Level Gagal — Level ini membutuhkan perulangan (FOR atau WHILE), bukan perintah berulang manual!";
    } else if (level.requiredLoopType === "for_and_while") {
      if (!loopTypesUsed.has("for") || !loopTypesUsed.has("while")) {
        conceptValid = false;
        conceptFeedback = "❌ Level Gagal — Level Grand Master 8 mewajibkan kombinasi kedua jenis perulangan: FOR dan WHILE!";
      }
    }
  }

  const success = allCollected && !isCrashed && !isInfiniteLoop && conceptValid && hasTakeBattery && (invalidBatteryPickupCount === 0) && (takeBatteryExecutedCount > 0);

  return {
    steps,
    success,
    crashed: isCrashed,
    infiniteLoop: isInfiniteLoop,
    crashReason: isInfiniteLoop ? "❌ Level Gagal — Loop tidak pernah berhenti (infinite loop)." : crashReason,
    collectedBatteryIds: collectedArray,
    totalBatteries,
    usedLoop,
    loopTypesUsed: Array.from(loopTypesUsed),
    conceptValid,
    conceptFeedback,
    totalBlocksUsed,
    isEfficient,
    hasTakeBatteryCommand: hasTakeBattery,
    takeBatteryExecutedCount,
    invalidBatteryPickupCount,
    usedBatteryAtWrongPosition: invalidBatteryPickupCount > 0,
    iterationTraces: allIterationTraces,
  };
}
