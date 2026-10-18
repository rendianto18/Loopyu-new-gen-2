import { INITIAL_8_LEVELS } from "../src/data/levelsData";
import { simulateLoopProgram } from "../src/utils/loopEngine";
import { diagnoseSimulation } from "../src/utils/diagnosticEngine";
import {
  generateCCode,
  generateCCodeWithMapping,
  generateFullCProgram,
} from "../src/utils/cCodeGenerator";
import { getTieredHintsForLevel } from "../src/utils/hintsEngine";
import { calculateLearningInsights } from "../src/utils/learningInsightsEngine";
import { CodeBlock } from "../src/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    passedCount++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    failedCount++;
    console.error(`✗ FAIL: ${testName}`);
  }
}

console.log("=========================================");
console.log("RUNNING LOOPYU 2.0 AUTOMATED TEST SUITE");
console.log("=========================================\n");

// --- 1. SIMULATION & SUCCESS/FAILURE DETERMINATION ---
const lvl1 = INITIAL_8_LEVELS[0];

// Test 1: Valid Level 1 Program Succeeds
const validLvl1Blocks: CodeBlock[] = [
  { id: "b1", type: "command", action: "move_forward" },
  { id: "b2", type: "command", action: "take_battery" },
  { id: "b3", type: "command", action: "move_forward" },
  { id: "b4", type: "command", action: "take_battery" },
];
const res1 = simulateLoopProgram(validLvl1Blocks, lvl1);
assert(res1.success === true, "Valid program completes Level 1 and triggers success");
assert(res1.collectedBatteryIds.length === 2, "Level 1 collects exactly 2 target batteries");

// Test 2: Incomplete Level 1 (Missing 2nd battery) Fails
const incompleteLvl1Blocks: CodeBlock[] = [
  { id: "b1", type: "command", action: "move_forward" },
  { id: "b2", type: "command", action: "take_battery" },
  { id: "b3", type: "command", action: "move_forward" },
];
const resIncomplete = simulateLoopProgram(incompleteLvl1Blocks, lvl1);
assert(resIncomplete.success === false, "Program missing final battery pickup fails Level 1");
assert(resIncomplete.collectedBatteryIds.length === 1, "Only 1 of 2 batteries collected");

// Test 3: Program with no take_battery action fails
const noTakeBlocks: CodeBlock[] = [
  { id: "b1", type: "command", action: "move_forward" },
  { id: "b2", type: "command", action: "move_forward" },
];
const resNoTake = simulateLoopProgram(noTakeBlocks, lvl1);
assert(resNoTake.success === false, "Program without take_battery action must never succeed");
assert(resNoTake.hasTakeBatteryCommand === false, "hasTakeBatteryCommand is false");

// Test 4: Wall collision detection
const crashBlocks: CodeBlock[] = [
  { id: "b1", type: "command", action: "move_backward" },
  { id: "b2", type: "command", action: "move_backward" },
  { id: "b3", type: "command", action: "move_backward" },
];
const resCrash = simulateLoopProgram(crashBlocks, lvl1);
assert(resCrash.crashed === true, "Robot moving out of grid bounds triggers crash");
assert(resCrash.success === false, "Crashed simulation results in failure");

// Test 5: Infinite loop safety limit
const infiniteWhileBlocks: CodeBlock[] = [
  {
    id: "while-inf",
    type: "while",
    condition: "path_clear",
    commands: [{ id: "turn", type: "command", action: "turn_left" }],
  },
];
const resInf = simulateLoopProgram(infiniteWhileBlocks, lvl1);
assert(resInf.infiniteLoop === true, "Safety limits stop infinite loop without crash");

// --- 2. SMART DIAGNOSTIC ENGINE TESTS ---
// Test 6: Empty program diagnosis
const diagEmpty = diagnoseSimulation([], lvl1, resNoTake);
assert(diagEmpty !== null && diagEmpty.code === "EMPTY_PROGRAM", "Empty program diagnosed as EMPTY_PROGRAM");

// Test 7: Empty loop body diagnosis
const emptyLoopBlocks: CodeBlock[] = [
  { id: "empty-for", type: "repeat", count: 3, commands: [] },
];
const resEmptyLoop = simulateLoopProgram(emptyLoopBlocks, lvl1);
const diagEmptyLoop = diagnoseSimulation(emptyLoopBlocks, lvl1, resEmptyLoop);
assert(
  diagEmptyLoop !== null && diagEmptyLoop.code === "EMPTY_LOOP_BODY",
  "Empty loop body diagnosed as EMPTY_LOOP_BODY with relatedBlockId"
);
assert(diagEmptyLoop?.relatedBlockId === "empty-for", "Identified exact related loop block ID");

// Test 8: Missing battery action diagnosis
const diagNoTake = diagnoseSimulation(noTakeBlocks, lvl1, resNoTake);
assert(
  diagNoTake !== null && diagNoTake.code === "BATTERY_MISSING_ACTION",
  "Missing take battery action diagnosed as BATTERY_MISSING_ACTION"
);
assert(diagNoTake?.whyItMatters.length! > 10, "Provides clear pedagogical explanation of why it matters");

// Test 9: Uncollected battery diagnosis
const diagIncomplete = diagnoseSimulation(incompleteLvl1Blocks, lvl1, resIncomplete);
assert(
  diagIncomplete !== null && diagIncomplete.code === "BATTERY_UNCOLLECTED",
  "Uncollected battery diagnosed as BATTERY_UNCOLLECTED with actionable hint"
);

// Test 10: Wall collision diagnosis
const diagCrash = diagnoseSimulation(crashBlocks, lvl1, resCrash);
assert(
  diagCrash !== null && diagCrash.code === "COLLISION_WALL",
  "Boundary collision diagnosed as COLLISION_WALL"
);

// --- 3. CODE EXPLORER & C CODE GENERATOR TESTS ---
// Test 11: C Code Generation for Repeat / For Loop
const lvl2 = INITIAL_8_LEVELS[1];
const lvl2Solution: CodeBlock[] = [
  {
    id: "rep-4",
    type: "repeat",
    count: 4,
    commands: [
      { id: "m1", type: "command", action: "move_forward" },
      { id: "t1", type: "command", action: "take_battery" },
    ],
  },
];
const cCode2 = generateCCode(lvl2Solution);
assert(cCode2.includes("for (int i = 0; i < 4; i++) {"), "Generates correct for (int i = 0; i < 4; i++) syntax");
assert(cCode2.includes("move();"), "Generates move();");
assert(cCode2.includes("collect();"), "Generates collect();");

// Test 12: C Code Explorer with Line Mapping
const explorerData = generateCCodeWithMapping(lvl2Solution, "Lintasan Baterai");
assert(explorerData.lines.length >= 4, "Generates structured lines array for Code Explorer");
assert(explorerData.blockToLineMap["rep-4"] === 1, "Maps repeat block to line 1");
assert(typeof explorerData.blockToLineMap["m1"] === "number", "Maps inner move command to line number");
assert(explorerData.loopElements.length === 1, "Detects loop element breakdown");
assert(explorerData.loopElements[0].initialization?.includes("int i = 0"), "Explains loop initialization in Indonesian");

// Test 13: Full C Program Includes Header Note
const fullC = generateFullCProgram(lvl2Solution, "Lintasan Baterai");
assert(fullC.includes('#include "loopyu_robot.h"'), "Includes loopyu_robot.h header library");
assert(fullC.includes("int main() {"), "Includes standard int main() entrypoint");

// Test 14: While Loop C Code Generation
const lvl4 = INITIAL_8_LEVELS[3];
const lvl4Solution: CodeBlock[] = [
  {
    id: "w1",
    type: "while",
    condition: "path_clear",
    commands: [{ id: "m4", type: "command", action: "move_forward" }],
  },
  { id: "t4", type: "command", action: "take_battery" },
];
const cCode4 = generateCCode(lvl4Solution);
assert(cCode4.includes("while (pathClear()) {"), "Generates correct while (pathClear()) syntax");

// --- 4. 5-TIER PROGRESSIVE HINTS ENGINE TESTS ---
// Test 15: All 8 levels have 5 distinct progressive tiers
for (let id = 1; id <= 8; id++) {
  const lvl = INITIAL_8_LEVELS[id - 1];
  const hints = getTieredHintsForLevel(lvl);
  assert(hints.length === 5, `Level ${id} has exactly 5 progressive hint tiers`);
  assert(hints[0].tier === 1 && hints[0].title.includes("Pertanyaan Pemandu"), `Level ${id} Tier 1 is Guiding Question`);
  assert(hints[1].tier === 2 && hints[1].title.includes("Konsep"), `Level ${id} Tier 2 is Conceptual Hint`);
  assert(hints[2].tier === 3, `Level ${id} Tier 3 is Contextual Suggestion`);
  assert(hints[3].tier === 4, `Level ${id} Tier 4 is Small Example Pattern`);
  assert(hints[4].tier === 5, `Level ${id} Tier 5 is Solution Walkthrough`);
}

// --- 5. STUDENT LEARNING INSIGHTS ENGINE TESTS ---
// Test 16: Learning Insights computes correct metrics and deduplicates
const mockCompleted = [1, 2, 2, 3]; // Contains duplicate
const mockFails = { 1: 0, 2: 2, 3: 1, 4: 3 };
const mockHints = { 1: 1, 2: 3, 3: 2 };
const mockErrors = { COLLISION_WALL: 2, BATTERY_MISSING_ACTION: 1 };

const insights = calculateLearningInsights(
  INITIAL_8_LEVELS,
  mockCompleted,
  mockFails,
  mockHints,
  mockErrors
);

assert(insights.completedCount === 3, "Deduplicates completed levels (3 completed, not 4)");
assert(insights.completionPercentage === Math.round((3 / 8) * 100), "Computes accurate percentage");
assert(insights.hintsUnlockedTotal === 6, "Calculates total unlocked hints accurately");
assert(insights.conceptsPracticed.length >= 4, "Tracks distinct programming concepts");
assert(insights.suggestedReviews.length > 0, "Generates actionable review recommendations based on fails");

// --- 6. ADVANCED FOR & WHILE LOOP PARAMETER SCENARIOS (SECTION J) ---
// Scenario 1: for (int i = 1; i <= 5; i++) produces 1, 2, 3, 4, 5
const for1to5Blocks: CodeBlock[] = [
  {
    id: "for-1-5",
    type: "repeat",
    startVal: 1,
    conditionOp: "<=",
    count: 5,
    stepOp: "++",
    commands: [{ id: "m-for1", type: "command", action: "wait" }],
  },
];
const simFor1 = simulateLoopProgram(for1to5Blocks, lvl1);
const varValues1 = simFor1.iterationTraces
  .filter((t) => t.actionName === "FOR_EXECUTE")
  .map((t) => t.variableValue);
assert(
  JSON.stringify(varValues1) === JSON.stringify([1, 2, 3, 4, 5]),
  "Scenario 1: for (int i = 1; i <= 5; i++) traces exact values: 1, 2, 3, 4, 5"
);
assert(
  simFor1.iterationTraces.some((t) => t.isLoopExit && t.variableValue === 6),
  "Scenario 1: loop stops when i reaches 6 (6 <= 5 FALSE)"
);

// Scenario 2: for (int i = 2; i <= 10; i += 2) produces 2, 4, 6, 8, 10
const forEvenBlocks: CodeBlock[] = [
  {
    id: "for-even",
    type: "repeat",
    startVal: 2,
    conditionOp: "<=",
    count: 10,
    stepOp: "+=2",
    commands: [{ id: "m-even", type: "command", action: "wait" }],
  },
];
const simForEven = simulateLoopProgram(forEvenBlocks, lvl1);
const varValuesEven = simForEven.iterationTraces
  .filter((t) => t.actionName === "FOR_EXECUTE")
  .map((t) => t.variableValue);
assert(
  JSON.stringify(varValuesEven) === JSON.stringify([2, 4, 6, 8, 10]),
  "Scenario 2: for (int i = 2; i <= 10; i += 2) traces exact values: 2, 4, 6, 8, 10"
);

// Scenario 3: while (x > 2) with x = 5 and x-- produces 5, 4, 3 then stops
const whileCountdownBlocks: CodeBlock[] = [
  {
    id: "while-count",
    type: "while",
    whileMode: "counter",
    condition: "counter",
    counterVar: "x",
    startVal: 5,
    conditionOp: ">",
    targetVal: 2,
    stepOp: "--",
    commands: [{ id: "m-wcount", type: "command", action: "wait" }],
  },
];
const simWhileCountdown = simulateLoopProgram(whileCountdownBlocks, lvl1);
const varValuesWhile = simWhileCountdown.iterationTraces
  .filter((t) => t.actionName === "WHILE_COUNTER_EXECUTE")
  .map((t) => t.variableValue);
assert(
  JSON.stringify(varValuesWhile) === JSON.stringify([5, 4, 3]),
  "Scenario 3: while (x > 2) with x = 5 and x-- traces exact values: 5, 4, 3 then stops"
);
assert(
  simWhileCountdown.iterationTraces.some((t) => t.isLoopExit && t.variableValue === 2),
  "Scenario 3: while stops when x reaches 2 (2 > 2 FALSE)"
);

// Scenario 4: while with unchanged counter detected as potential infinite loop
const whileUnchangedBlocks: CodeBlock[] = [
  {
    id: "while-inf-x",
    type: "while",
    whileMode: "counter",
    condition: "counter",
    counterVar: "x",
    startVal: 5,
    conditionOp: ">",
    targetVal: 2,
    stepOp: "none",
    commands: [{ id: "m-winf", type: "command", action: "wait" }],
  },
];
const simWhileInf = simulateLoopProgram(whileUnchangedBlocks, lvl1);
assert(
  simWhileInf.infiniteLoop === true,
  "Scenario 4: while with unchanged variable correctly detected as infinite loop"
);

// Scenario 5: Loop counting in wrong direction produces infinite loop & diagnosis
const whileWrongDirBlocks: CodeBlock[] = [
  {
    id: "while-wrong-dir",
    type: "while",
    whileMode: "counter",
    condition: "counter",
    counterVar: "x",
    startVal: 5,
    conditionOp: ">",
    targetVal: 2,
    stepOp: "++", // Wrong direction: x increases when x > 2!
    commands: [{ id: "m-wwrong", type: "command", action: "wait" }],
  },
];
const simWhileWrong = simulateLoopProgram(whileWrongDirBlocks, lvl1);
assert(
  simWhileWrong.infiniteLoop === true,
  "Scenario 5: variable incrementing away from stop condition triggers infinite loop"
);
const diagWrong = diagnoseSimulation(whileWrongDirBlocks, lvl1, simWhileWrong);
assert(
  diagWrong !== null && diagWrong.code === "INFINITE_LOOP",
  "Scenario 5: infinite loop diagnosed with educational feedback"
);

console.log("\n=========================================");
console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("=========================================");

if (failedCount > 0) {
  process.exit(1);
}
