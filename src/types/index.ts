export type Direction = "right" | "down" | "left" | "up";

export type CommandAction = "move_forward" | "move_backward" | "turn_left" | "turn_right" | "take_battery" | "wait" | "jump";

export interface CommandBlock {
  id: string;
  type: "command";
  action: CommandAction;
}

export type StepOperator = "++" | "+=2" | "+=3" | "--" | "-=2" | "none";
export type ConditionOperator = "<" | "<=" | ">" | ">=" | "!=";
export type WhileMode = "sensor" | "counter";

export interface IterationTrace {
  variableName: string; // e.g. "i" or "x" or "n"
  variableValue: number; // e.g. 1
  conditionExpr: string; // e.g. "i <= 5"
  conditionResult: boolean; // true
  stepExpr: string; // e.g. "i++ -> i = 2"
  actionName: string; // e.g. "MAJU" or "AMBIL BATERAI"
  explanation: string; // e.g. "i = 1, kondisi 1 <= 5 (TRUE). Robot melangkah maju."
  isLoopExit?: boolean; // when condition becomes false
}

export interface RepeatBlock {
  id: string;
  type: "repeat";
  count: number; // target / limit value (e.g., 5 in i <= 5)
  variable?: string; // default "i"
  startVal?: number; // default 0 or 1
  conditionOp?: ConditionOperator; // default "<" or "<="
  stepOp?: StepOperator; // default "++"
  commands: CodeBlock[];
}

export interface WhileBlock {
  id: string;
  type: "while";
  whileMode?: WhileMode; // "sensor" | "counter", defaults to "sensor"
  condition: "path_clear" | "has_battery" | "not_at_target" | "energy_gt_zero" | "counter";
  counterVar?: string; // e.g. "x"
  startVal?: number; // e.g. 5
  conditionOp?: ConditionOperator; // e.g. ">"
  targetVal?: number; // e.g. 2
  stepOp?: StepOperator; // e.g. "--"
  commands: CodeBlock[];
}

export interface DoWhileBlock {
  id: string;
  type: "do_while";
  condition: "path_clear" | "has_battery" | "not_at_target";
  commands: CodeBlock[];
}

export interface BreakBlock {
  id: string;
  type: "break";
}

export interface ContinueBlock {
  id: string;
  type: "continue";
}

export interface IfBlock {
  id: string;
  type: "if";
  condition: "at_target" | "path_clear" | "has_battery";
  commands: CodeBlock[];
}

export type CodeBlock = CommandBlock | RepeatBlock | WhileBlock | DoWhileBlock | BreakBlock | ContinueBlock | IfBlock;

export type BlockType = "move_forward" | "move_backward" | "turn_left" | "turn_right" | "take_battery" | "wait" | "repeat" | "while" | "do_while" | "break" | "continue" | "if";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  points: number;
  coins: number;
  badges: string[];
  isOnline: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  levelId?: number;
  assignedTo: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  tags: string[];
  solutionCode?: CodeBlock[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DebuggingChallengeConfig {
  title: string;
  description: string;
  bugDescription: string;
  expectedFix: string;
  buggyBlocks: CodeBlock[];
  hints: string[];
}

export interface IterationTraceItem {
  id: string;
  stepIndex: number;
  loopId: string;
  loopType: "for" | "while";
  iteration: number;
  varName: string;
  varValBefore: number;
  conditionText: string;
  conditionResult: boolean;
  actionExecuted: string;
  varValAfter: number;
  updateText: string;
  explanation: string;
  isTerminated?: boolean;
  terminationReason?: string;
}

export interface LevelConfig {
  id: number;
  name: string;
  focus: string;
  concept?: "for" | "while" | "do_while" | "nested" | "break" | "continue" | "mixed";
  requiredLoopType?: "for" | "while" | "do_while" | "any_loop" | "for_and_while" | "none";
  expectedIterations?: number;
  stageEL: string;
  challengeExample?: string;
  difficulty?: string;
  difficultyStars?: number;
  description: string;
  instruction: string;
  gridSize: { rows: number; cols: number };
  startPos: { x: number; y: number; dir: Direction };
  targetBatteries: { id: string; x: number; y: number }[];
  obstacles?: { x: number; y: number }[];
  allowedBlocks: ("move_forward" | "move_backward" | "turn_left" | "turn_right" | "take_battery" | "wait" | "jump" | "repeat" | "while" | "do_while" | "break" | "continue" | "if")[];
  maxBlocksForEfficiency: number;
  maxBlocksLimit?: number;
  defaultBuggyCode?: CodeBlock[];
  debuggingChallenge?: DebuggingChallengeConfig;
  hints: {
    hint1: string;
    hint2: string;
    hint3: string;
  };
  reflectionQuestions: {
    id: string;
    question: string;
    placeholder: string;
  }[];
}

export interface AttemptLog {
  id: string;
  levelId: number;
  userId: string;
  userName: string;
  success: boolean;
  stepsTaken: number;
  batteriesCollected: number;
  totalBatteries: number;
  blocksUsed: number;
  isEfficient: boolean;
  hintsUsedCount: number;
  scoreAwarded: number;
  feedbackGiven: string;
  timestamp: string;
}

export interface ReflectionResponse {
  id: string;
  levelId: number;
  userId: string;
  userName: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
}

export interface AssessmentRecord {
  id: string;
  type: "pretest" | "posttest";
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  answers: { questionId: number; selectedOption: number; isCorrect: boolean }[];
  submittedAt: string;
}

export interface AppNotification {
  id: string;
  type: "task_status" | "task_created" | "mission_completed" | "hint_requested" | "badge_earned" | "review_requested" | "success" | "info" | "warning" | "error";
  title: string;
  message: string;
  taskId?: string;
  levelId?: number;
  userName?: string;
  read: boolean;
  createdAt: string;
  timestamp?: string;
  avatar?: string;
}

// ==========================================
// TEAM, USER, ASSIGNMENT & CLASSROOM SCHEMAS
// ==========================================

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT" | "TEAM_LEADER";

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  classId: string;
  teamId?: string;
  status?: "ACTIVE" | "INACTIVE";
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  description?: string;
  code?: string;
  academicYear?: string;
  createdAt: string;
}

export interface Team {
  id: string;
  teamName: string;
  teamCode: string; // e.g. "LP-4821"
  classId: string;
  leaderId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  status: "ACTIVE" | "INACTIVE";
}

export interface TeamMemberRecord {
  id: string;
  teamId: string;
  userId: string;
  role: "LEADER" | "MEMBER";
  joinedAt: string;
}

export type AssignmentType = "GAME" | "QUIZ" | "REFLECTION" | "TEST" | "MIXED";
export type AssignmentMode = "INDIVIDUAL" | "TEAM";

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type?: AssignmentType;
  mode: AssignmentMode;
  classId?: string;
  levelIds?: number[];
  targetLevels?: number[];
  quizId?: string;
  reflectionId?: string;
  reflectionTemplateId?: string;
  testId?: string;
  targetType?: "CLASS" | "TEAM" | "INDIVIDUAL";
  targetId?: string;
  deadline?: string;
  dueDate?: string;
  createdBy: string;
  status: "ACTIVE" | "DRAFT" | "ARCHIVED";
  createdAt: string;
}

export interface AssignmentProgress {
  id: string;
  assignmentId: string;
  teamId?: string;
  userId?: string;
  userName?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  completedLevels?: number[];
  completedLevelIds?: number[];
  gameProgress?: number; // 0 - 100%
  quizScore: number;
  quizCompleted: boolean;
  reflectionSubmitted?: boolean;
  reflectionCompleted?: boolean;
  testScore: number;
  testCompleted: boolean;
  score: number;
  startedAt?: string;
  completedAt?: string;
}

export type ActivityType =
  | "JOIN_TEAM"
  | "LEAVE_TEAM"
  | "CREATE_TEAM"
  | "START_LEVEL"
  | "COMPLETE_LEVEL"
  | "SUBMIT_QUIZ"
  | "SUBMIT_REFLECTION"
  | "SUBMIT_TEST"
  | "COMPLETE_ASSIGNMENT";

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  activityType: ActivityType;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ==========================================
// QUIZ SCHEMAS
// ==========================================

export type QuizQuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "CODE_OUTPUT"
  | "IDENTIFY_ERROR"
  | "CHOOSE_LOOP"
  | "ARRANGE_CODE";

export interface Quiz {
  id: string;
  title: string;
  description: string;
  timeLimit: number; // in minutes
  passingScore: number;
  createdBy: string;
  status: "ACTIVE" | "DRAFT";
  questionCount?: number;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  question?: string;
  prompt?: string;
  codeSnippet?: string;
  type?: QuizQuestionType;
  options: (string | { id: string; text: string })[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
  order?: number;
  concept?: string;
  conceptTag?: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  userName?: string;
  teamId?: string;
  score: number;
  maxScore?: number;
  answers: { questionId: string; answer: string; isCorrect?: boolean }[];
  conceptFeedback?: Record<string, "Good" | "Review" | "GOOD" | "REVIEW">;
  startedAt?: string;
  completedAt?: string;
}

// ==========================================
// REFLECTION SCHEMAS
// ==========================================

export interface ReflectionQuestionItem {
  id: string;
  question: string;
  placeholder?: string;
  isTeamQuestion?: boolean;
}

export interface ReflectionTemplate {
  id: string;
  title: string;
  description?: string;
  assignmentId?: string;
  questions: ReflectionQuestionItem[];
  createdBy: string;
  createdAt?: string;
}

export interface ReflectionSubmission {
  id: string;
  reflectionId: string;
  userId: string;
  userName: string;
  teamId?: string;
  assignmentId?: string;
  answers: { questionId: string; answer: string }[];
  submittedAt: string;
}

// ==========================================
// FORMAL TEST SCHEMAS
// ==========================================

export type TestQuestionType =
  | "MULTIPLE_CHOICE"
  | "CODE_OUTPUT"
  | "PREDICT_ITERATIONS"
  | "FIND_ERROR";

export interface FormalTest {
  id: string;
  title: string;
  description: string;
  duration?: number; // in minutes
  timeLimitMinutes?: number;
  passingScore: number;
  maxAttempts: number;
  questionCount?: number;
  createdBy: string;
  status: "ACTIVE" | "DRAFT";
}

export interface TestQuestion {
  id: string;
  testId: string;
  question?: string;
  prompt?: string;
  codeSnippet?: string;
  type?: TestQuestionType;
  options: (string | { id: string; text: string })[];
  answer?: string;
  correctAnswer?: string;
  explanation?: string;
  points: number;
  order?: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  userId: string;
  userName?: string;
  teamId?: string;
  assignmentId?: string;
  score: number;
  totalPoints?: number;
  attemptNumber?: number;
  passed?: boolean;
  status?: "IN_PROGRESS" | "SUBMITTED";
  startedAt?: string;
  submittedAt?: string;
}

// ==========================================
// SETTINGS & AUDIT LOG SCHEMAS
// ==========================================

export interface AppSettings {
  websiteName?: string;
  schoolName?: string;
  academicYear?: string;
  whoCanCreateTeams?: "ADMIN" | "TEACHER" | "STUDENTS";
  maxTeamSize?: number;
  maxTeamMembers?: number;
  allowStudentTeamCreation?: boolean;
  requireReflectionBeforeTest?: boolean;
  showPublicLeaderboard?: boolean;
  requireTeacherApproval?: boolean;
  defaultPassingScore?: number;
  maxTestAttempts?: number;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  timestamp: string;
}

// ==========================================
// LOOPYU 2.0: SMART LEARNING & DIAGNOSTICS SCHEMAS
// ==========================================

export type DiagnosticErrorCode =
  | "COLLISION_WALL"
  | "COLLISION_OBSTACLE"
  | "BATTERY_MISSING_ACTION"
  | "BATTERY_UNCOLLECTED"
  | "BATTERY_WRONG_POSITION"
  | "LOOP_ITERATION_INSUFFICIENT"
  | "LOOP_ITERATION_EXCESSIVE"
  | "LOOP_CONDITION_PREVENTS_ACTION"
  | "COUNTER_WRONG_DIRECTION"
  | "COUNTER_NOT_UPDATED"
  | "COUNTER_STEP_TOO_LARGE"
  | "OFF_BY_ONE_ERROR"
  | "EMPTY_PROGRAM"
  | "EMPTY_LOOP_BODY"
  | "SAFETY_LIMIT_EXCEEDED"
  | "INFINITE_LOOP"
  | "CONCEPT_MISMATCH"
  | "UNKNOWN_FAILURE";

export interface DiagnosticDiagnosis {
  code: DiagnosticErrorCode;
  severity: "error" | "warning" | "info";
  title: string;
  whatHappened: string;
  whyItMatters: string;
  inspectBlock: string;
  actionableHint: string;
  relatedBlockId?: string;
  retrySuggestion?: string;
}

export interface CCodeLine {
  lineNumber: number;
  text: string;
  indent: number;
  blockId?: string;
  type?:
    | "comment"
    | "header"
    | "for_header"
    | "while_header"
    | "do_while_header"
    | "condition"
    | "command"
    | "block_close"
    | "empty_body";
  conceptExplanation?: {
    title: string;
    description: string;
    partName: "initialization" | "condition" | "update" | "body" | "action";
  };
}

export interface CCodeExplorerData {
  rawCode: string;
  fullProgram: string;
  lines: CCodeLine[];
  blockToLineMap: Record<string, number>;
  loopElements: {
    loopType: "for" | "while" | "do_while";
    initialization?: string;
    condition?: string;
    update?: string;
    bodySummary?: string;
  }[];
}

export interface TieredHint {
  tier: 1 | 2 | 3 | 4 | 5;
  title: string;
  badge: string;
  content: string;
  exampleSnippet?: string;
  codeIllustration?: string;
}

export interface LearningInsightsData {
  completedCount: number;
  totalLevels: number;
  completionPercentage: number;
  learningStage: string;
  totalAttempts: number;
  failedAttemptsTotal: number;
  attemptsByLevel: Record<number, number>;
  hintsUnlockedTotal: number;
  hintsUsedByLevel: Record<number, number>;
  conceptsPracticed: {
    id: string;
    name: string;
    description: string;
    status: "mastered" | "practiced" | "needs_review";
    levelIds: number[];
  }[];
  errorCategoryCounts: Record<string, number>;
  suggestedReviews: {
    topic: string;
    reason: string;
    recommendedLevelId: number;
  }[];
}

