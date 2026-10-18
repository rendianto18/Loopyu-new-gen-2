import React, { useState, useEffect, useRef } from "react";
import {
  CodeBlock,
  CommandAction,
  LevelConfig,
  RepeatBlock,
  WhileBlock,
  StepOperator,
  ConditionOperator,
  WhileMode,
} from "../../types";
import { soundManager } from "../../utils/audio";
import { generateFullCProgram } from "../../utils/cCodeGenerator";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  RotateCw,
  Zap,
  Repeat,
  Compass,
  Trash2,
  Plus,
  Blocks,
  Copy,
  Check,
  Undo2,
  GripVertical,
  GripHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Settings2,
  SlidersHorizontal,
  Lock,
} from "lucide-react";

interface CommandBuilderProps {
  level: LevelConfig;
  blocks: CodeBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<CodeBlock[]>>;
  disabled: boolean;
  activeBlockId: string | null;
  isRunning: boolean;
  onUndo?: () => void;
  canUndo?: boolean;
}

export const CommandBuilder: React.FC<CommandBuilderProps> = ({
  level,
  blocks,
  setBlocks,
  disabled,
  activeBlockId,
  isRunning,
}) => {
  const [copied, setCopied] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{ type: string; id?: string; source: "palette" | "workspace" } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragOverLoopId, setDragOverLoopId] = useState<string | null>(null);
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);

  // Active / Inactive state for FOR and WHILE in the palette
  const [isForActive, setIsForActive] = useState<boolean>(() => level.id !== 4 && level.allowedBlocks.includes("repeat"));
  const [isWhileActive, setIsWhileActive] = useState<boolean>(() => level.allowedBlocks.includes("while"));

  // Palette vertical position: "top" or "bottom" of the workspace
  const [palettePosition, setPalettePosition] = useState<"top" | "bottom">("top");

  // Palette height (in pixels) when resizable / dragged vertically
  const [paletteHeight, setPaletteHeight] = useState<number>(145);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [paletteNotice, setPaletteNotice] = useState<string | null>(null);

  // Sync active states when level changes
  useEffect(() => {
    // Misi 4 strictly requires WHILE, not FOR
    if (level.id === 4) {
      setIsForActive(false);
      setIsWhileActive(true);
    } else {
      setIsForActive(level.allowedBlocks.includes("repeat"));
      setIsWhileActive(level.allowedBlocks.includes("while"));
    }
  }, [level.id, level.allowedBlocks]);

  const showPaletteNotice = (msg: string) => {
    setPaletteNotice(msg);
    soundManager.play("lose");
    setTimeout(() => setPaletteNotice(null), 3500);
  };

  // Drag-to-resize divider handler (geser ketinggian palet ke atas dan bawah)
  const handleResizeStart = (clientY: number) => {
    setIsResizing(true);
    const startY = clientY;
    const startH = paletteHeight;

    const onMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY;
      const newHeight = palettePosition === "top" ? startH + deltaY : startH - deltaY;
      setPaletteHeight(Math.max(75, Math.min(360, newHeight)));
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const deltaY = e.touches[0].clientY - startY;
        const newHeight = palettePosition === "top" ? startH + deltaY : startH - deltaY;
        setPaletteHeight(Math.max(75, Math.min(360, newHeight)));
      }
    };

    const onEnd = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onEnd);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onEnd);
  };

  // Undo history stack
  const [history, setHistory] = useState<CodeBlock[][]>([]);

  const pushHistory = (newBlocks: CodeBlock[]) => {
    setHistory((prev) => [...prev.slice(-15), JSON.parse(JSON.stringify(blocks))]);
    setBlocks(newBlocks);
  };

  const handleUndo = () => {
    if (disabled || history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setBlocks(last);
    soundManager.playClick();
  };

  // Helper to count total blocks recursively
  const countBlocks = (list: CodeBlock[]): number => {
    let count = 0;
    for (const b of list) {
      count++;
      if (b.type === "repeat" || b.type === "while" || b.type === "do_while" || b.type === "if") {
        count += countBlocks(b.commands);
      }
    }
    return count;
  };

  const totalUsedBlocks = countBlocks(blocks);
  const maxLimit = level.maxBlocksLimit ?? 8;
  const isLimitReached = totalUsedBlocks >= maxLimit;
  const isOptimal = totalUsedBlocks <= level.maxBlocksForEfficiency;

  // Add child to loop
  const addChildToLoop = (loopId: string, action: CommandAction) => {
    if (disabled || isLimitReached) return;
    const childBlock: CodeBlock = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "command",
      action,
    };
    const addRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list.map((b) => {
        if (b.id === loopId && (b.type === "repeat" || b.type === "while")) {
          return { ...b, commands: [...b.commands, childBlock] };
        }
        if (b.type === "repeat" || b.type === "while") {
          return { ...b, commands: addRecursive(b.commands) };
        }
        return b;
      });
    };
    pushHistory(addRecursive(blocks));
    setSelectedLoopId(loopId);
    soundManager.playAddBlock();
  };

  // Move block from workspace/loop into a target loop
  const moveBlockToLoop = (blockId: string, targetLoopId: string) => {
    if (disabled || blockId === targetLoopId) return;

    let movedBlock: CodeBlock | null = null;
    const removeRecursive = (list: CodeBlock[]): CodeBlock[] => {
      const res: CodeBlock[] = [];
      for (const b of list) {
        if (b.id === blockId) {
          movedBlock = b;
          continue;
        }
        if (b.type === "repeat" || b.type === "while") {
          res.push({ ...b, commands: removeRecursive(b.commands) });
        } else {
          res.push(b);
        }
      }
      return res;
    };

    const newBlocks = removeRecursive(blocks);
    if (!movedBlock) return;

    const addRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list.map((b) => {
        if (b.id === targetLoopId && (b.type === "repeat" || b.type === "while")) {
          return { ...b, commands: [...b.commands, movedBlock!] };
        }
        if (b.type === "repeat" || b.type === "while") {
          return { ...b, commands: addRecursive(b.commands) };
        }
        return b;
      });
    };

    pushHistory(addRecursive(newBlocks));
    setSelectedLoopId(targetLoopId);
    soundManager.playAddBlock();
  };

  // Move block out of a loop to root workspace
  const moveBlockToRoot = (blockId: string, targetIndex?: number) => {
    if (disabled) return;

    let movedBlock: CodeBlock | null = null;
    const removeRecursive = (list: CodeBlock[]): CodeBlock[] => {
      const res: CodeBlock[] = [];
      for (const b of list) {
        if (b.id === blockId) {
          movedBlock = b;
          continue;
        }
        if (b.type === "repeat" || b.type === "while") {
          res.push({ ...b, commands: removeRecursive(b.commands) });
        } else {
          res.push(b);
        }
      }
      return res;
    };

    const newBlocks = removeRecursive(blocks);
    if (!movedBlock) return;

    if (targetIndex !== undefined && targetIndex >= 0 && targetIndex <= newBlocks.length) {
      newBlocks.splice(targetIndex, 0, movedBlock);
    } else {
      newBlocks.push(movedBlock);
    }

    pushHistory(newBlocks);
    soundManager.playClick();
  };

  // Add a command block: if a loop is selected or an empty loop exists, insert inside it!
  const addCommand = (action: CommandAction) => {
    if (disabled || isLimitReached) return;

    // Check if there is an intended loop target
    let targetLoop: string | null = null;
    if (selectedLoopId && blocks.some((b) => b.id === selectedLoopId)) {
      targetLoop = selectedLoopId;
    } else {
      // Find empty loop or single loop in workspace
      const emptyLoop = blocks.find(
        (b) => (b.type === "repeat" || b.type === "while") && b.commands.length === 0
      );
      if (emptyLoop) {
        targetLoop = emptyLoop.id;
      } else {
        const loopBlocks = blocks.filter((b) => b.type === "repeat" || b.type === "while");
        if (loopBlocks.length === 1) {
          targetLoop = loopBlocks[0].id;
        }
      }
    }

    if (targetLoop) {
      addChildToLoop(targetLoop, action);
      return;
    }

    const newBlock: CodeBlock = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "command",
      action,
    };
    pushHistory([...blocks, newBlock]);
    soundManager.playAddBlock();
  };

  // Add for loop (repeat)
  const addForLoop = () => {
    if (disabled || isLimitReached) return;
    if (!isForActive) {
      showPaletteNotice(level.id === 4 ? "Misi 4 WAJIB menggunakan WHILE, tidak FOR!" : "Balok FOR sedang Nonaktif. Klik toggle 'FOR: Aktif' untuk mengaktifkannya!");
      return;
    }
    const defaultCount = level.expectedIterations || 3;
    const newBlock: RepeatBlock = {
      id: `for-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "repeat",
      count: defaultCount,
      commands: [], // Empty container: user adds actions themselves
    };
    pushHistory([...blocks, newBlock]);
    setSelectedLoopId(newBlock.id);
    soundManager.playAddBlock();
  };

  // Add while loop
  const addWhileLoop = () => {
    if (disabled || isLimitReached) return;
    if (!isWhileActive) {
      showPaletteNotice("Balok WHILE sedang Nonaktif. Klik toggle 'WHILE: Aktif' untuk mengaktifkannya!");
      return;
    }
    const newBlock: WhileBlock = {
      id: `while-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: "while",
      condition: "path_clear",
      commands: [], // Empty container: user adds actions themselves
    };
    pushHistory([...blocks, newBlock]);
    setSelectedLoopId(newBlock.id);
    soundManager.playAddBlock();
  };

  // Delete a block by ID
  const deleteBlock = (id: string) => {
    if (disabled) return;
    const removeRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list
        .filter((b) => b.id !== id)
        .map((b) => {
          if (b.type === "repeat" || b.type === "while" || b.type === "do_while") {
            return { ...b, commands: removeRecursive(b.commands) };
          }
          return b;
        });
    };
    pushHistory(removeRecursive(blocks));
    soundManager.playClick();
  };

  // Update repeat count
  const updateRepeatCount = (id: string, newCount: number) => {
    if (disabled) return;
    const boundedCount = Math.max(1, Math.min(20, newCount));
    const updateRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list.map((b) => {
        if (b.id === id && b.type === "repeat") {
          return { ...b, count: boundedCount };
        }
        if (b.type === "repeat" || b.type === "while") {
          return { ...b, commands: updateRecursive(b.commands) };
        }
        return b;
      });
    };
    pushHistory(updateRecursive(blocks));
    soundManager.playClick();
  };

  // Update repeat block configuration (startVal, conditionOp, stepOp, count, variable)
  const updateRepeatBlock = (id: string, updates: Partial<RepeatBlock>) => {
    if (disabled) return;
    const updateRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list.map((b) => {
        if (b.id === id && b.type === "repeat") {
          return { ...b, ...updates };
        }
        if (b.type === "repeat" || b.type === "while") {
          return { ...b, commands: updateRecursive(b.commands) };
        }
        return b;
      });
    };
    pushHistory(updateRecursive(blocks));
    soundManager.playClick();
  };

  // Update while block configuration (whileMode, condition, counterVar, startVal, conditionOp, targetVal, stepOp)
  const updateWhileBlock = (id: string, updates: Partial<WhileBlock>) => {
    if (disabled) return;
    const updateRecursive = (list: CodeBlock[]): CodeBlock[] => {
      return list.map((b) => {
        if (b.id === id && b.type === "while") {
          return { ...b, ...updates };
        }
        if (b.type === "repeat" || b.type === "while") {
          return { ...b, commands: updateRecursive(b.commands) };
        }
        return b;
      });
    };
    pushHistory(updateRecursive(blocks));
    soundManager.playClick();
  };

  // Reorder root blocks
  const reorderBlocks = (fromIdx: number, toIdx: number) => {
    if (disabled || fromIdx === toIdx) return;
    const next = [...blocks];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    pushHistory(next);
    soundManager.playClick();
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, type: string, source: "palette" | "workspace", id?: string) => {
    if (disabled) return;
    setDraggedItem({ type, source, id });
    e.dataTransfer.setData("text/plain", JSON.stringify({ type, source, id }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index?: number, loopId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (index !== undefined) setDragOverIndex(index);
    if (loopId !== undefined) setDragOverLoopId(loopId);
  };

  const handleDrop = (e: React.DragEvent, targetIndex?: number, targetLoopId?: string) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverLoopId(null);
    if (disabled) return;

    try {
      const dataStr = e.dataTransfer.getData("text/plain");
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      if (data.source === "palette") {
        if (isLimitReached) {
          soundManager.play("lose");
          return;
        }
        if (targetLoopId) {
          // Dropped into a loop pocket or loop block
          if (
            data.type === "move_forward" ||
            data.type === "turn_left" ||
            data.type === "turn_right" ||
            data.type === "take_battery"
          ) {
            addChildToLoop(targetLoopId, data.type as CommandAction);
          }
        } else {
          // Dropped into root workspace
          if (data.type === "repeat") addForLoop();
          else if (data.type === "while") addWhileLoop();
          else addCommand(data.type as CommandAction);
        }
      } else if (data.source === "workspace" && data.id) {
        if (targetLoopId) {
          // User dragged an existing block from workspace (or another loop) into this loop!
          moveBlockToLoop(data.id, targetLoopId);
        } else if (targetIndex !== undefined) {
          const fromIdx = blocks.findIndex((b) => b.id === data.id);
          if (fromIdx !== -1) {
            reorderBlocks(fromIdx, targetIndex);
          } else {
            // Dragged out of a loop to root
            moveBlockToRoot(data.id, targetIndex);
          }
        } else {
          // Dropped onto root workspace background
          moveBlockToRoot(data.id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyCCode = () => {
    const code = generateFullCProgram(blocks, level.name);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check which blocks are allowed in this level
  const isAllowed = (type: string) => {
    return level.allowedBlocks.includes(type as any);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Top Header: Tab Toggle, Undo, and Block Counter */}
      {/* Top Header: Title, Position Toggle, Undo, and Block Counter */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-200 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs sm:text-sm font-black shadow-2xs">
            <Blocks className="w-4 h-4 text-indigo-600" />
            <span>Balok Program</span>
          </div>

          {/* Toggle Palet Position: Atas vs Bawah */}
          <button
            type="button"
            onClick={() => {
              setPalettePosition((prev) => (prev === "top" ? "bottom" : "top"));
              soundManager.playClick();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-all shadow-xs cursor-pointer"
            title={palettePosition === "top" ? "Geser/Pindahkan Palet ke Bawah Workspace" : "Geser/Pindahkan Palet ke Atas Workspace"}
          >
            {palettePosition === "top" ? (
              <>
                <ArrowDown className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Palet: Di Atas ⬆️ (Pindah ke Bawah ⬇️)</span>
                <span className="sm:hidden">Palet ⬇️</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Palet: Di Bawah ⬇️ (Pindah ke Atas ⬆️)</span>
                <span className="sm:hidden">Palet ⬆️</span>
              </>
            )}
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={disabled || history.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-all shadow-xs cursor-pointer"
            title="Batal / Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">Balok:</span>
          <span
            className={`font-mono font-bold px-2 py-0.5 rounded-md text-xs ${
              isLimitReached
                ? "bg-rose-100 text-rose-700"
                : isOptimal
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {totalUsedBlocks} / {maxLimit}
          </span>
        </div>
      </div>

      {/* Main Container: Supports positioning Palette on Top or Bottom */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
        {/* Render Palette & Workspace conditionally based on palettePosition */}
        {(() => {
          // --- 1. Palette Component ---
          const paletteSection = (
            <div
              key="palette-section"
              style={{ height: `${paletteHeight}px` }}
              className="p-3 bg-white border-slate-200 overflow-y-auto transition-all flex flex-col justify-between shrink-0 select-none shadow-2xs"
            >
              <div>
                {/* Palette Header with FOR & WHILE Active/Inactive Toggles */}
                <div className="flex items-center justify-between mb-2 flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                      Palet Balok
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                      (Tarik atau Klik)
                    </span>
                  </div>

                  {/* FOR & WHILE Aktif / Nonaktif Toggle Feature */}
                  <div className="flex items-center gap-1.5">
                    {/* FOR Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (level.id === 4 && !isForActive) {
                          showPaletteNotice("Misi 4 WAJIB menggunakan loop WHILE, tidak boleh FOR!");
                          return;
                        }
                        setIsForActive(!isForActive);
                        soundManager.playClick();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                        isForActive
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 shadow-2xs hover:bg-indigo-100"
                          : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={
                        level.id === 4
                          ? "Misi 4 WAJIB menggunakan WHILE, tidak FOR!"
                          : isForActive
                          ? "Klik untuk Menonaktifkan Balok FOR"
                          : "Klik untuk Mengaktifkan Balok FOR"
                      }
                    >
                      <Repeat className="w-3 h-3 text-indigo-600" />
                      <span>FOR:</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                          isForActive ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-700"
                        }`}
                      >
                        {isForActive ? "Aktif ✓" : "Nonaktif ✕"}
                      </span>
                    </button>

                    {/* WHILE Toggle Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsWhileActive(!isWhileActive);
                        soundManager.playClick();
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                        isWhileActive
                          ? "bg-purple-50 border-purple-300 text-purple-900 shadow-2xs hover:bg-purple-100"
                          : "bg-slate-100 border-slate-300 text-slate-500 hover:bg-slate-200"
                      }`}
                      title={isWhileActive ? "Klik untuk Menonaktifkan Balok WHILE" : "Klik untuk Mengaktifkan Balok WHILE"}
                    >
                      <Compass className="w-3 h-3 text-purple-600" />
                      <span>WHILE:</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                          isWhileActive ? "bg-purple-600 text-white" : "bg-slate-300 text-slate-700"
                        }`}
                      >
                        {isWhileActive ? "Aktif ✓" : "Nonaktif ✕"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Temporary Notification Banner */}
                {paletteNotice && (
                  <div className="mb-2 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn shadow-xs">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="flex-1">{paletteNotice}</span>
                  </div>
                )}

                {/* Palette Blocks List */}
                <div className="flex flex-wrap gap-2">
                  {/* FOR Block (Repeat) */}
                  {(isAllowed("repeat") || isForActive || level.id === 4) && (
                    <div
                      draggable={!disabled && !isLimitReached && isForActive}
                      onDragStart={(e) => {
                        if (!isForActive) {
                          e.preventDefault();
                          showPaletteNotice(level.id === 4 ? "Misi 4 WAJIB menggunakan WHILE, tidak FOR!" : "Balok FOR sedang Nonaktif!");
                          return;
                        }
                        handleDragStart(e, "repeat", "palette");
                      }}
                      onClick={() => {
                        if (!isForActive) {
                          showPaletteNotice(level.id === 4 ? "Misi 4 WAJIB menggunakan WHILE, tidak FOR!" : "Balok FOR sedang Nonaktif. Klik toggle 'FOR: Aktif' di atas untuk menggunakannya.");
                          return;
                        }
                        addForLoop();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold border select-none ${
                        !isForActive
                          ? "bg-slate-100 text-slate-400 border-slate-300 opacity-60 cursor-not-allowed"
                          : isLimitReached
                          ? "bg-indigo-600 text-white border-indigo-700 opacity-35 cursor-not-allowed"
                          : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={
                        !isForActive
                          ? (level.id === 4 ? "Misi 4 WAJIB menggunakan WHILE, tidak FOR!" : "Balok FOR sedang Nonaktif. Klik toggle di atas untuk mengaktifkan.")
                          : isLimitReached
                          ? `Batas ${maxLimit} balok tercapai`
                          : "for (int i = 0; i < N; i++)"
                      }
                    >
                      <Repeat className="w-3.5 h-3.5" />
                      <span className={!isForActive ? "line-through opacity-80" : ""}>FOR (...)</span>
                      {!isForActive ? (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-extrabold ml-0.5">
                          {level.id === 4 ? "🔒 Wajib WHILE" : "🔒 Nonaktif"}
                        </span>
                      ) : (
                        <Plus className="w-3 h-3 text-indigo-200 ml-0.5" />
                      )}
                    </div>
                  )}

                  {/* WHILE Block */}
                  {(isAllowed("while") || isWhileActive) && (
                    <div
                      draggable={!disabled && !isLimitReached && isWhileActive}
                      onDragStart={(e) => {
                        if (!isWhileActive) {
                          e.preventDefault();
                          showPaletteNotice("Balok WHILE sedang Nonaktif!");
                          return;
                        }
                        handleDragStart(e, "while", "palette");
                      }}
                      onClick={() => {
                        if (!isWhileActive) {
                          showPaletteNotice("Balok WHILE sedang Nonaktif. Klik toggle 'WHILE: Aktif' di atas untuk menggunakannya.");
                          return;
                        }
                        addWhileLoop();
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all text-xs font-bold border select-none ${
                        !isWhileActive
                          ? "bg-slate-100 text-slate-400 border-slate-300 opacity-60 cursor-not-allowed"
                          : isLimitReached
                          ? "bg-purple-600 text-white border-purple-700 opacity-35 cursor-not-allowed"
                          : "bg-purple-600 text-white border-purple-700 hover:bg-purple-700 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={
                        !isWhileActive
                          ? "Balok WHILE sedang Nonaktif. Klik toggle di atas untuk mengaktifkan."
                          : isLimitReached
                          ? `Batas ${maxLimit} balok tercapai`
                          : "while (pathClear())"
                      }
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span className={!isWhileActive ? "line-through opacity-80" : ""}>WHILE (pathClear)</span>
                      {!isWhileActive ? (
                        <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-extrabold ml-0.5">
                          🔒 Nonaktif
                        </span>
                      ) : (
                        <Plus className="w-3 h-3 text-purple-200 ml-0.5" />
                      )}
                    </div>
                  )}

                  {/* MOVE Action */}
                  {isAllowed("move_forward") && (
                    <div
                      draggable={!disabled && !isLimitReached}
                      onDragStart={(e) => handleDragStart(e, "move_forward", "palette")}
                      onClick={() => addCommand("move_forward")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white transition-all text-xs font-bold border border-sky-600 ${
                        isLimitReached ? "opacity-35 cursor-not-allowed" : "hover:bg-sky-600 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={isLimitReached ? `Batas ${maxLimit} balok tercapai` : "move();"}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>MAJU</span>
                      <Plus className="w-3 h-3 text-sky-200 ml-0.5" />
                    </div>
                  )}

                  {/* MOVE BACKWARD Action */}
                  {isAllowed("move_backward") && (
                    <div
                      draggable={!disabled && !isLimitReached}
                      onDragStart={(e) => handleDragStart(e, "move_backward", "palette")}
                      onClick={() => addCommand("move_backward")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white transition-all text-xs font-bold border border-blue-700 ${
                        isLimitReached ? "opacity-35 cursor-not-allowed" : "hover:bg-blue-700 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={isLimitReached ? `Batas ${maxLimit} balok tercapai` : "moveBackward();"}
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                      <span>MUNDUR</span>
                      <Plus className="w-3 h-3 text-blue-200 ml-0.5" />
                    </div>
                  )}

                  {/* TURN LEFT */}
                  {isAllowed("turn_left") && (
                    <div
                      draggable={!disabled && !isLimitReached}
                      onDragStart={(e) => handleDragStart(e, "turn_left", "palette")}
                      onClick={() => addCommand("turn_left")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-white transition-all text-xs font-bold border border-teal-600 ${
                        isLimitReached ? "opacity-35 cursor-not-allowed" : "hover:bg-teal-600 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={isLimitReached ? `Batas ${maxLimit} balok tercapai` : "turnLeft();"}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>BELOK KIRI</span>
                      <Plus className="w-3 h-3 text-teal-200 ml-0.5" />
                    </div>
                  )}

                  {/* TURN RIGHT */}
                  {isAllowed("turn_right") && (
                    <div
                      draggable={!disabled && !isLimitReached}
                      onDragStart={(e) => handleDragStart(e, "turn_right", "palette")}
                      onClick={() => addCommand("turn_right")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500 text-white transition-all text-xs font-bold border border-teal-600 ${
                        isLimitReached ? "opacity-35 cursor-not-allowed" : "hover:bg-teal-600 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={isLimitReached ? `Batas ${maxLimit} balok tercapai` : "turnRight();"}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>BELOK KANAN</span>
                      <Plus className="w-3 h-3 text-teal-200 ml-0.5" />
                    </div>
                  )}

                  {/* COLLECT / TAKE BATTERY */}
                  {isAllowed("take_battery") && (
                    <div
                      draggable={!disabled && !isLimitReached}
                      onDragStart={(e) => handleDragStart(e, "take_battery", "palette")}
                      onClick={() => addCommand("take_battery")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-white transition-all text-xs font-bold border border-amber-600 ${
                        isLimitReached ? "opacity-35 cursor-not-allowed" : "hover:bg-amber-600 active:scale-95 cursor-pointer shadow-xs"
                      }`}
                      title={isLimitReached ? `Batas ${maxLimit} balok tercapai` : "collect();"}
                    >
                      <Zap className="w-3.5 h-3.5 fill-white" />
                      <span>AMBIL BATERAI</span>
                      <Plus className="w-3 h-3 text-amber-200 ml-0.5" />
                    </div>
                  )}
                </div>

                {/* Limit Reached Warning Alert */}
                {isLimitReached && (
                  <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    <span>
                      Batas maksimal {maxLimit} balok untuk Level {level.id} telah tercapai. Hapus balok di workspace jika ingin menambah yang baru.
                    </span>
                  </div>
                )}
              </div>
            </div>
          );

          // --- 2. Interactive Draggable Divider (Geser Palet Atas / Bawah) ---
          const dividerSection = (
            <div
              key="divider-section"
              onMouseDown={(e) => handleResizeStart(e.clientY)}
              onTouchStart={(e) => {
                if (e.touches.length > 0) handleResizeStart(e.touches[0].clientY);
              }}
              onDoubleClick={() => setPaletteHeight(paletteHeight > 130 ? 80 : 160)}
              className={`h-4 bg-slate-100 hover:bg-indigo-100 border-y border-slate-200 cursor-row-resize flex items-center justify-center transition-colors select-none group shrink-0 ${
                isResizing ? "bg-indigo-200 border-indigo-400" : ""
              }`}
              title="Tarik ke atas atau ke bawah untuk mengatur tinggi palet balok (atau klik 2x untuk ubah cepat)"
            >
              <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white border border-slate-200 shadow-2xs group-hover:border-indigo-300 text-slate-500 group-hover:text-indigo-700 text-[10px] font-bold transition-all">
                <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                <span>↕ Geser Palet ke Atas / Bawah</span>
                <span className="text-[9px] font-mono text-slate-400">({paletteHeight}px)</span>
              </div>
            </div>
          );

          // --- 3. Workspace Droppable Area Component ---
          const workspaceSection = (
            <div
              key="workspace-section"
              onDragOver={(e) => handleDragOver(e)}
              onDrop={(e) => handleDrop(e)}
              className="flex-1 p-3 overflow-y-auto space-y-2.5 min-h-0"
            >
              {blocks.length === 0 ? (
                <div
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e)}
                  className="h-56 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-400 text-xs text-center p-6 bg-white/60 transition-all hover:border-indigo-400 hover:bg-indigo-50/20"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2 border border-indigo-100">
                    <Blocks className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-slate-700 text-sm">Area Kerja Balok Kosong</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Klik balok di palet untuk menambahkan perintah, atau tarik balok ke sini untuk menyusun program.
                  </p>
                </div>
              ) : (
                blocks.map((block, idx) => (
                  <div
                    key={block.id}
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, block.type, "workspace", block.id)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    className={`transition-transform ${dragOverIndex === idx ? "border-t-2 border-indigo-500 pt-1" : ""}`}
                  >
                    <BlockItem
                      block={block}
                      index={idx}
                      activeBlockId={activeBlockId}
                      disabled={disabled}
                      selectedLoopId={selectedLoopId}
                      onSelectLoop={(id) => setSelectedLoopId(id)}
                      onDelete={() => deleteBlock(block.id)}
                      onUpdateRepeat={(count) => updateRepeatCount(block.id, count)}
                      onUpdateRepeatBlock={(updates) => updateRepeatBlock(block.id, updates)}
                      onUpdateWhileBlock={(updates) => updateWhileBlock(block.id, updates)}
                      onAddChild={(action) => addChildToLoop(block.id, action)}
                      onDeleteChild={(childId) => deleteBlock(childId)}
                      isAllowed={isAllowed}
                      isLimitReached={isLimitReached}
                      handleDragStart={handleDragStart}
                      handleDragOver={handleDragOver}
                      handleDrop={handleDrop}
                      dragOverLoopId={dragOverLoopId}
                    />
                  </div>
                ))
              )}
            </div>
          );

          // Return sections in user-selected order (Top vs Bottom)
          return palettePosition === "top" ? (
            <>
              {paletteSection}
              {dividerSection}
              {workspaceSection}
            </>
          ) : (
            <>
              {workspaceSection}
              {dividerSection}
              {paletteSection}
            </>
          );
        })()}
      </div>
    </div>
  );
};

interface BlockItemProps {
  block: CodeBlock;
  index: number;
  activeBlockId: string | null;
  disabled: boolean;
  selectedLoopId: string | null;
  onSelectLoop: (id: string) => void;
  onDelete: () => void;
  onUpdateRepeat: (count: number) => void;
  onUpdateRepeatBlock?: (updates: Partial<RepeatBlock>) => void;
  onUpdateWhileBlock?: (updates: Partial<WhileBlock>) => void;
  onAddChild: (action: CommandAction) => void;
  onDeleteChild: (id: string) => void;
  isAllowed: (type: string) => boolean;
  isLimitReached: boolean;
  handleDragStart: (e: React.DragEvent, type: string, source: "palette" | "workspace", id?: string) => void;
  handleDragOver: (e: React.DragEvent, index?: number, loopId?: string) => void;
  handleDrop: (e: React.DragEvent, index?: number, loopId?: string) => void;
  dragOverLoopId: string | null;
}

const BlockItem: React.FC<BlockItemProps> = ({
  block,
  activeBlockId,
  disabled,
  selectedLoopId,
  onSelectLoop,
  onDelete,
  onUpdateRepeat,
  onUpdateRepeatBlock,
  onUpdateWhileBlock,
  onAddChild,
  onDeleteChild,
  isAllowed,
  isLimitReached,
  handleDragStart,
  handleDragOver,
  handleDrop,
  dragOverLoopId,
}) => {
  const [showForParams, setShowForParams] = useState<boolean>(false);
  const [showWhileParams, setShowWhileParams] = useState<boolean>(false);
  const isActive = activeBlockId === block.id;
  const isSelectedLoop = selectedLoopId === block.id;

  // Single Command Block
  if (block.type === "command") {
    let label = "MAJU";
    let cSyntax = "move();";
    let icon = <ArrowRight className="w-4 h-4 text-white" />;
    let bgColor = "bg-sky-500 hover:bg-sky-600 border-sky-600 text-white";

    if (block.action === "move_backward") {
      label = "MUNDUR";
      cSyntax = "moveBackward();";
      icon = <ArrowDown className="w-4 h-4 text-white" />;
      bgColor = "bg-blue-600 hover:bg-blue-700 border-blue-700 text-white";
    } else if (block.action === "turn_left") {
      label = "BELOK KIRI";
      cSyntax = "turnLeft();";
      icon = <RotateCcw className="w-4 h-4 text-white" />;
      bgColor = "bg-teal-500 hover:bg-teal-600 border-teal-600 text-white";
    } else if (block.action === "turn_right") {
      label = "BELOK KANAN";
      cSyntax = "turnRight();";
      icon = <RotateCw className="w-4 h-4 text-white" />;
      bgColor = "bg-teal-500 hover:bg-teal-600 border-teal-600 text-white";
    } else if (block.action === "take_battery") {
      label = "AMBIL BATERAI";
      cSyntax = "collect();";
      icon = <Zap className="w-4 h-4 fill-white text-white" />;
      bgColor = "bg-amber-500 hover:bg-amber-600 border-amber-600 text-white";
    }

    return (
      <div
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border shadow-xs transition-all ${bgColor} ${
          isActive ? "ring-4 ring-amber-300 scale-[1.02] shadow-md" : ""
        }`}
      >
        <div className="flex items-center gap-2.5">
          <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
          {icon}
          <div>
            <span className="text-xs font-black tracking-wide">{label}</span>
            <span className="ml-2 font-mono text-[10px] opacity-80">{cSyntax}</span>
          </div>
        </div>

        <button
          onClick={onDelete}
          disabled={disabled}
          className="p-1 rounded-lg hover:bg-black/20 text-white/80 hover:text-white transition-colors disabled:opacity-30"
          title="Hapus balok"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // FOR Loop Block (Blockly-style pocket container)
  if (block.type === "repeat") {
    return (
      <div
        onClick={() => onSelectLoop(block.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDragOver(e, undefined, block.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDrop(e, undefined, block.id);
        }}
        className={`rounded-2xl border-2 transition-all shadow-xs overflow-hidden cursor-pointer ${
          isSelectedLoop
            ? "border-indigo-600 ring-4 ring-indigo-200 scale-[1.005]"
            : isActive
            ? "border-indigo-500 ring-4 ring-indigo-300 scale-[1.01]"
            : "border-indigo-600/90 bg-white hover:border-indigo-700"
        }`}
      >
        {/* Loop Notch Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-indigo-600 text-white">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
            <Repeat className="w-4 h-4" />
            <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
              <span>FOR</span>
              <span className="text-indigo-200">ulang</span>

              {/* Interactive Count Stepper */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-white text-indigo-950 rounded-lg px-1.5 py-0.5 border border-indigo-300 shadow-xs font-mono"
              >
                <button
                  type="button"
                  onClick={() => onUpdateRepeat(block.count - 1)}
                  disabled={disabled || block.count <= 1}
                  className="px-1 text-indigo-700 hover:bg-indigo-50 rounded text-xs font-bold disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <span className="px-1.5 font-bold text-xs">
                  {block.count}
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateRepeat(block.count + 1)}
                  disabled={disabled || block.count >= 20}
                  className="px-1 text-indigo-700 hover:bg-indigo-50 rounded text-xs font-bold disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>

              <span>kali</span>

              {/* Live C Syntax Badge */}
              <span className="font-mono text-[10px] text-amber-200 bg-indigo-900/90 px-2 py-0.5 rounded border border-indigo-400/40 font-bold hidden sm:inline">
                for (int {block.variable || "i"} = {block.startVal ?? 0}; {block.variable || "i"} {block.conditionOp || "<"} {block.count}; {block.stepOp === "+=2" ? `${block.variable || "i"} += 2` : block.stepOp === "+=3" ? `${block.variable || "i"} += 3` : block.stepOp === "--" ? `${block.variable || "i"}--` : block.stepOp === "-=2" ? `${block.variable || "i"} -= 2` : block.stepOp === "none" ? "/* diam */" : `${block.variable || "i"}++`})
              </span>

              {/* Toggle Parameter Panel */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForParams(!showForParams);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-indigo-100 hover:text-white text-[10px] font-bold border border-indigo-400/50 shadow-2xs transition-colors cursor-pointer"
                title="Atur parameter perulangan for bahasa C"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{showForParams ? "Tutup" : "⚙️ Parameter for"}</span>
              </button>

              {isSelectedLoop && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-extrabold tracking-wide ml-1">
                  ✓ Aktif
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-indigo-700 text-indigo-100 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            title="Hapus loop FOR"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Parameter Editor for FOR */}
        {showForParams && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-t border-indigo-500/50 p-3 text-xs text-white space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Parameter for (inisialisasi; kondisi; pembaruan)
              </span>
              <span className="font-mono text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 font-bold">
                for (int {block.variable || "i"} = {block.startVal ?? 0}; {block.variable || "i"} {block.conditionOp || "<"} {block.count}; {block.stepOp === "+=2" ? `${block.variable || "i"} += 2` : block.stepOp === "--" ? `${block.variable || "i"}--` : block.stepOp === "none" ? "/* diam */" : `${block.variable || "i"}++`})
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => onUpdateRepeatBlock?.({ startVal: 0, conditionOp: "<", stepOp: "++" })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
              >
                i=0; i &lt; N; i++ (Standar)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRepeatBlock?.({ startVal: 1, conditionOp: "<=", stepOp: "++" })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
              >
                i=1; i &lt;= N; i++ (Mencacah 1..N)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRepeatBlock?.({ startVal: block.count, conditionOp: ">", stepOp: "--" })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
              >
                i=N; i &gt; 0; i-- (Hitung Mundur)
              </button>
              <button
                type="button"
                onClick={() => onUpdateRepeatBlock?.({ startVal: 0, conditionOp: "<", stepOp: "+=2" })}
                className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
              >
                i += 2 (Lompat Genap)
              </button>
            </div>

            {/* Granular Parameter Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-800">
              {/* 1. Inisialisasi startVal */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  1. Nilai Awal ({block.variable || "i"})
                </label>
                <div className="flex items-center gap-1">
                  {[0, 1, 2, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => onUpdateRepeatBlock?.({ startVal: val })}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                        (block.startVal ?? 0) === val
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Operator Kondisi conditionOp */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  2. Operator Batas
                </label>
                <div className="flex items-center gap-1">
                  {(["<", "<=", ">", ">="] as ConditionOperator[]).map((op) => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => onUpdateRepeatBlock?.({ conditionOp: op })}
                      className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                        (block.conditionOp || "<") === op
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Perubahan Nilai stepOp */}
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  3. Perubahan Nilai (Step)
                </label>
                <div className="flex items-center gap-1">
                  {(["++", "+=2", "--", "none"] as StepOperator[]).map((sop) => (
                    <button
                      key={sop}
                      type="button"
                      onClick={() => onUpdateRepeatBlock?.({ stepOp: sop })}
                      className={`flex-1 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                        (block.stepOp || "++") === sop
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      {sop === "none" ? "none ⚠️" : sop}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Pedagogical Note */}
            <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800 leading-snug">
              💡 <span className="font-semibold text-sky-300">Pemberitahuan Konsep:</span>{" "}
              {block.conditionOp === "<=" ? (
                <span>
                  Operator <strong>&lt;=</strong> menyertakan batas <strong>{block.count}</strong>.
                  {(block.startVal ?? 0) === 1 && ` Mencacah 1..${block.count} menghasilkan ${block.count} kali iterasi.`}
                  {(block.startVal ?? 0) === 0 && ` Mencacah 0..${block.count} menghasilkan ${block.count + 1} kali iterasi (awas off-by-one)!`}
                </span>
              ) : (
                <span>
                  Operator <strong>&lt;</strong> berhenti saat {block.variable || "i"} mencapai <strong>{block.count}</strong>.
                  {(block.startVal ?? 0) === 0 && ` Mencacah 0..<${block.count} menghasilkan ${block.count} kali iterasi.`}
                  {(block.startVal ?? 0) === 1 && ` Mencacah 1..<${block.count} hanya menghasilkan ${Math.max(0, block.count - 1)} kali iterasi!`}
                </span>
              )}
              {block.stepOp === "none" && (
                <span className="block mt-1 text-rose-400 font-bold">
                  ⚠️ Nilai {block.variable || "i"} tidak bertambah/berkurang (none). Ini memicu perulangan tak berujung (Infinite Loop)!
                </span>
              )}
            </div>
          </div>
        )}

        {/* Loop Pocket (Nested Child Blocks) */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, undefined, block.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(e, undefined, block.id);
          }}
          className={`p-2.5 pl-4 ml-4 my-1.5 border-l-4 border-indigo-400 space-y-1.5 bg-indigo-50/40 rounded-r-xl min-h-[50px] transition-colors ${
            dragOverLoopId === block.id ? "bg-indigo-100/70 border-indigo-600" : ""
          }`}
        >
          {block.commands.length === 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectLoop(block.id);
                if (isAllowed("move_forward")) onAddChild("move_forward");
              }}
              className="py-3.5 px-3 border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl bg-indigo-100/60 hover:bg-indigo-100 text-indigo-950 text-xs text-center flex flex-col items-center justify-center gap-1 my-1 cursor-pointer transition-all"
            >
              <span className="font-extrabold text-xs text-indigo-900 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-indigo-700" /> Wadah FOR Kosong (Klik untuk Tambah MAJU)
              </span>
              <span className="text-[11px] text-indigo-700">
                Gunakan tombol{" "}
                <strong className="font-bold text-sky-800 bg-sky-100 px-1.5 py-0.5 rounded border border-sky-300">
                  + Maju
                </strong>
                {isAllowed("take_battery") && (
                  <>
                    {" "}
                    dan{" "}
                    <strong className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                      + Ambil Baterai
                    </strong>
                  </>
                )}{" "}
                di bawah wadah atau klik balok di palet atas
              </span>
            </div>
          ) : (
            block.commands.map((cmd) => {
              const isChildActive = activeBlockId === cmd.id;
              let childBg = "bg-sky-500 text-white";
              let childLabel = "MAJU";
              let childSyntax = "move();";
              let childIcon = <ArrowRight className="w-3.5 h-3.5" />;

              if (cmd.type === "command") {
                if (cmd.action === "move_backward") {
                  childBg = "bg-blue-600 text-white";
                  childLabel = "MUNDUR";
                  childSyntax = "moveBackward();";
                  childIcon = <ArrowDown className="w-3.5 h-3.5" />;
                } else if (cmd.action === "turn_left") {
                  childBg = "bg-teal-500 text-white";
                  childLabel = "BELOK KIRI";
                  childSyntax = "turnLeft();";
                  childIcon = <RotateCcw className="w-3.5 h-3.5" />;
                } else if (cmd.action === "turn_right") {
                  childBg = "bg-teal-500 text-white";
                  childLabel = "BELOK KANAN";
                  childSyntax = "turnRight();";
                  childIcon = <RotateCw className="w-3.5 h-3.5" />;
                } else if (cmd.action === "take_battery") {
                  childBg = "bg-amber-500 text-white";
                  childLabel = "AMBIL BATERAI";
                  childSyntax = "collect();";
                  childIcon = <Zap className="w-3.5 h-3.5 fill-white" />;
                }
              }

              return (
                <div
                  key={cmd.id}
                  draggable={!disabled}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, cmd.type === "command" ? cmd.action : cmd.type, "workspace", cmd.id);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${childBg} ${
                    isChildActive ? "ring-2 ring-amber-300 scale-[1.01]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 opacity-50 cursor-grab" />
                    {childIcon}
                    <span>{childLabel}</span>
                    <span className="font-mono text-[10px] opacity-80">{childSyntax}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChild(cmd.id);
                    }}
                    disabled={disabled}
                    className="p-0.5 rounded hover:bg-black/20 text-white/80 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}

          {/* Quick Add Buttons Inside Loop Pocket */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {isAllowed("move_forward") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("move_forward");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-sky-700" /> + Maju
              </button>
            )}
            {isAllowed("move_backward") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("move_backward");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-blue-700" /> + Mundur
              </button>
            )}
            {isAllowed("take_battery") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("take_battery");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-amber-700" /> + Ambil Baterai
              </button>
            )}
            {isAllowed("turn_left") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("turn_left");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 border border-teal-300 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-teal-700" /> + Kiri
              </button>
            )}
            {isAllowed("turn_right") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("turn_right");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 border border-teal-300 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-teal-700" /> + Kanan
              </button>
            )}
          </div>
        </div>

        {/* Closing loop notch bottom */}
        <div className="px-3 py-1 bg-indigo-50 border-t border-indigo-100 text-[10px] font-mono font-bold text-indigo-900">
          &#125; // akhir loop for
        </div>
      </div>
    );
  }

  // WHILE Loop Block
  if (block.type === "while") {
    return (
      <div
        onClick={() => onSelectLoop(block.id)}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDragOver(e, undefined, block.id);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDrop(e, undefined, block.id);
        }}
        className={`rounded-2xl border-2 transition-all shadow-xs overflow-hidden cursor-pointer ${
          isSelectedLoop
            ? "border-purple-600 ring-4 ring-purple-200 scale-[1.005]"
            : isActive
            ? "border-purple-500 ring-4 ring-purple-300 scale-[1.01]"
            : "border-purple-600/90 bg-white hover:border-purple-700"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-purple-600 text-white">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 opacity-50 cursor-grab" />
            <Compass className="w-4 h-4" />
            <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
              <span>WHILE</span>
              {block.whileMode === "counter" ? (
                <span className="bg-purple-950/80 px-2 py-0.5 rounded-md font-mono text-amber-200 border border-purple-400/50 font-bold">
                  {block.counterVar || "x"} {block.conditionOp || ">"} {block.targetVal ?? 2}
                </span>
              ) : (
                <span className="bg-purple-800/80 px-2 py-0.5 rounded-md font-mono text-purple-100 border border-purple-400/40">
                  {block.condition === "has_battery"
                    ? "hasBattery()"
                    : block.condition === "not_at_target"
                    ? "!atTarget()"
                    : block.condition === "energy_gt_zero"
                    ? "energy > 0"
                    : "pathClear()"}
                </span>
              )}
              <span className="text-purple-200 text-[11px] hidden sm:inline">
                {block.whileMode === "counter"
                  ? `(int ${block.counterVar || "x"} = ${block.startVal ?? 5}; update ${block.stepOp || "--"})`
                  : "(kondisi sensor)"}
              </span>

              {/* Toggle Parameter Panel */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowWhileParams(!showWhileParams);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-purple-100 hover:text-white text-[10px] font-bold border border-purple-400/50 shadow-2xs transition-colors cursor-pointer"
                title="Atur parameter perulangan while bahasa C"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{showWhileParams ? "Tutup" : "⚙️ Parameter while"}</span>
              </button>

              {isSelectedLoop && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500 text-white font-extrabold tracking-wide ml-1">
                  ✓ Aktif
                </span>
              )}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            disabled={disabled}
            className="p-1 rounded-lg hover:bg-purple-700 text-purple-100 hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
            title="Hapus loop WHILE"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expandable Parameter Editor for WHILE */}
        {showWhileParams && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-t border-purple-500/50 p-3 text-xs text-white space-y-2.5 shadow-inner"
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-extrabold text-[11px] uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-purple-400" />
                Konfigurasi while (syarat_kondisi_benar)
              </span>
              {block.whileMode === "counter" ? (
                <span className="font-mono text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 font-bold">
                  int {block.counterVar || "x"} = {block.startVal ?? 5}; while ({block.counterVar || "x"} {block.conditionOp || ">"} {block.targetVal ?? 2}) &#123; ... {block.counterVar || "x"}{block.stepOp === "none" ? "/*no step*/" : block.stepOp || "--"}; &#125;
                </span>
              ) : (
                <span className="font-mono text-[11px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800 font-bold">
                  while ({block.condition === "has_battery" ? "hasBattery()" : block.condition === "not_at_target" ? "!atTarget()" : block.condition === "energy_gt_zero" ? "energy > 0" : "pathClear()"})
                </span>
              )}
            </div>

            {/* Mode Switcher: Sensor vs Counter Variable */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => onUpdateWhileBlock?.({ whileMode: "sensor", condition: "path_clear" })}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  block.whileMode !== "counter"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Kondisi Sensor Lingkungan</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateWhileBlock?.({
                    whileMode: "counter",
                    condition: "counter",
                    counterVar: "x",
                    startVal: 5,
                    conditionOp: ">",
                    targetVal: 2,
                    stepOp: "--",
                  })
                }
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  block.whileMode === "counter"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Kondisi Variabel Numerik (x &gt; 2)</span>
              </button>
            </div>

            {/* Mode 1: Sensor condition options */}
            {block.whileMode !== "counter" ? (
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">
                  Pilih Kondisi Sensor:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: "path_clear", code: "pathClear()", desc: "Jalan di depan aman (bukan dinding)" },
                    { id: "has_battery", code: "hasBattery()", desc: "Ada baterai di petak robot saat ini" },
                    { id: "not_at_target", code: "!atTarget()", desc: "Robot belum mencapai pos sasaran" },
                    { id: "energy_gt_zero", code: "energy > 0", desc: "Energi baterai robot masih ada" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onUpdateWhileBlock?.({ condition: item.id as any })}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        (block.condition || "path_clear") === item.id
                          ? "bg-purple-950 border-purple-500 text-white ring-1 ring-purple-400"
                          : "bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <div className="font-mono text-xs font-bold text-purple-300">{item.code}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Mode 2: Counter variable options */
              <div className="space-y-2">
                {/* Presets for Counter While */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-bold">Preset:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWhileBlock?.({ counterVar: "x", startVal: 5, conditionOp: ">", targetVal: 2, stepOp: "--" })
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
                  >
                    x=5; x &gt; 2; x-- (Hitung Mundur 5..3)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWhileBlock?.({ counterVar: "n", startVal: 1, conditionOp: "<=", targetVal: 5, stepOp: "+=2" })
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
                  >
                    n=1; n &lt;= 5; n += 2 (Ganjil 1, 3, 5)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWhileBlock?.({ counterVar: "angka", startVal: 2, conditionOp: "<=", targetVal: 8, stepOp: "+=2" })
                    }
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-mono border border-slate-700 cursor-pointer"
                  >
                    angka=2; &lt;= 8; += 2 (Genap 2..8)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateWhileBlock?.({ counterVar: "x", startVal: 1, conditionOp: "<=", targetVal: 5, stepOp: "none" })
                    }
                    className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 text-rose-200 text-[10px] font-mono border border-rose-800 cursor-pointer"
                    title="Uji Infinite Loop: nilai x tidak di-update"
                  >
                    x tidak di-update ⚠️ (Infinite Loop)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Start val */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      1. Inisialisasi: int {block.counterVar || "x"} =
                    </label>
                    <div className="flex items-center gap-1">
                      {[5, 4, 3, 2, 1].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => onUpdateWhileBlock?.({ startVal: val })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            (block.startVal ?? 5) === val
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Condition Op & Target */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      2. Syarat Berhenti: {block.counterVar || "x"} op batas
                    </label>
                    <div className="flex items-center gap-1">
                      {(['>', '>=', '<', '<='] as ConditionOperator[]).map((op) => (
                        <button
                          key={op}
                          type="button"
                          onClick={() => onUpdateWhileBlock?.({ conditionOp: op })}
                          className={`flex-1 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            (block.conditionOp || ">") === op
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {op}
                        </button>
                      ))}
                      <div className="flex items-center bg-slate-800 px-1 rounded text-xs font-mono font-bold">
                        <button
                          type="button"
                          onClick={() => onUpdateWhileBlock?.({ targetVal: Math.max(0, (block.targetVal ?? 2) - 1) })}
                          className="px-1 text-purple-300 hover:text-white"
                        >
                          -
                        </button>
                        <span className="px-1 text-white">{block.targetVal ?? 2}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateWhileBlock?.({ targetVal: Math.min(10, (block.targetVal ?? 2) + 1) })}
                          className="px-1 text-purple-300 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Step Update inside while */}
                  <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">
                      3. Update Nilai di Dalam Loop
                    </label>
                    <div className="flex items-center gap-1">
                      {(["--", "-=2", "++", "+=2", "none"] as StepOperator[]).map((sop) => (
                        <button
                          key={sop}
                          type="button"
                          onClick={() => onUpdateWhileBlock?.({ stepOp: sop })}
                          className={`flex-1 py-1 rounded text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                            (block.stepOp || "--") === sop
                              ? "bg-purple-600 text-white"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {sop === "none" ? "none ⚠️" : `${block.counterVar || "x"}${sop}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pedagogical info */}
                <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-lg border border-slate-800 leading-snug">
                  💡 <span className="font-semibold text-purple-300">Konsep While:</span> Selama kondisi{" "}
                  <code className="text-amber-300 font-mono font-bold">{block.counterVar || "x"} {block.conditionOp || ">"} {block.targetVal ?? 2}</code> bernilai TRUE, loop terus berjalan.
                  {block.stepOp === "none" ? (
                    <span className="block mt-1 text-rose-400 font-bold">
                      ⚠️ Bahaya Infinite Loop: Nilai {block.counterVar || "x"} tidak diperbarui di dalam badan loop, sehingga kondisi akan selalu bernilai TRUE dan tidak pernah berhenti!
                    </span>
                  ) : (
                    <span className="block mt-0.5 text-slate-400">
                      Di setiap iterasi, {block.counterVar || "x"} di-update dengan {block.counterVar || "x"}{block.stepOp || "--"} hingga kondisi menjadi FALSE.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pocket */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDragOver(e, undefined, block.id);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDrop(e, undefined, block.id);
          }}
          className={`p-2.5 pl-4 ml-4 my-1.5 border-l-4 border-purple-400 space-y-1.5 bg-purple-50/40 rounded-r-xl min-h-[50px] transition-colors ${
            dragOverLoopId === block.id ? "bg-purple-100/70 border-purple-600" : ""
          }`}
        >
          {block.commands.length === 0 ? (
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSelectLoop(block.id);
                if (isAllowed("move_forward")) onAddChild("move_forward");
              }}
              className="py-3.5 px-3 border-2 border-dashed border-purple-300 hover:border-purple-500 rounded-xl bg-purple-100/60 hover:bg-purple-100 text-purple-900 text-xs text-center flex flex-col items-center justify-center gap-1 my-1 cursor-pointer transition-all"
            >
              <span className="font-extrabold text-xs text-purple-800 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-purple-700" /> Wadah WHILE Kosong (Klik di Sini untuk Isi MAJU)
              </span>
              <span className="text-[11px] text-purple-600">
                Klik tombol <strong className="underline font-bold">+ Maju</strong> di bawah atau klik balok di palet atas
              </span>
            </div>
          ) : (
            block.commands.map((cmd) => {
              const isChildActive = activeBlockId === cmd.id;
              let childBg = "bg-sky-500 text-white";
              let childLabel = "MAJU";
              let childSyntax = "move();";
              let childIcon = <ArrowRight className="w-3.5 h-3.5" />;

              if (cmd.type === "command") {
                if (cmd.action === "move_backward") {
                  childBg = "bg-blue-600 text-white";
                  childLabel = "MUNDUR";
                  childSyntax = "moveBackward();";
                  childIcon = <ArrowDown className="w-3.5 h-3.5" />;
                } else if (cmd.action === "turn_left") {
                  childBg = "bg-teal-500 text-white";
                  childLabel = "BELOK KIRI";
                  childSyntax = "turnLeft();";
                  childIcon = <RotateCcw className="w-3.5 h-3.5" />;
                } else if (cmd.action === "turn_right") {
                  childBg = "bg-teal-500 text-white";
                  childLabel = "BELOK KANAN";
                  childSyntax = "turnRight();";
                  childIcon = <RotateCw className="w-3.5 h-3.5" />;
                } else if (cmd.action === "take_battery") {
                  childBg = "bg-amber-500 text-white";
                  childLabel = "AMBIL BATERAI";
                  childSyntax = "collect();";
                  childIcon = <Zap className="w-3.5 h-3.5 fill-white" />;
                }
              }

              return (
                <div
                  key={cmd.id}
                  draggable={!disabled}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(e, cmd.type === "command" ? cmd.action : cmd.type, "workspace", cmd.id);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-all ${childBg} ${
                    isChildActive ? "ring-2 ring-amber-300 scale-[1.01]" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-3.5 h-3.5 opacity-50 cursor-grab" />
                    {childIcon}
                    <span>{childLabel}</span>
                    <span className="font-mono text-[10px] opacity-80">{childSyntax}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteChild(cmd.id);
                    }}
                    disabled={disabled}
                    className="p-0.5 rounded hover:bg-black/20 text-white/80 hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}

          {/* Quick Add Buttons */}
          <div className="flex items-center gap-1.5 pt-1 flex-wrap">
            {isAllowed("move_forward") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("move_forward");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-sky-100 hover:bg-sky-200 border border-sky-300 text-sky-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-sky-700" /> + Maju
              </button>
            )}
            {isAllowed("move_backward") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("move_backward");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 border border-blue-300 text-blue-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-blue-700" /> + Mundur
              </button>
            )}
            {isAllowed("turn_left") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("turn_left");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 border border-teal-300 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-teal-700" /> + Kiri
              </button>
            )}
            {isAllowed("turn_right") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("turn_right");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 border border-teal-300 text-teal-800 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-teal-700" /> + Kanan
              </button>
            )}
            {isAllowed("take_battery") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild("take_battery");
                }}
                disabled={disabled || isLimitReached}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[11px] font-bold flex items-center gap-1 transition-all shadow-2xs active:scale-95"
              >
                <Plus className="w-3 h-3 text-amber-700" /> + Ambil Baterai
              </button>
            )}
          </div>
        </div>

        {/* Bottom */}
        <div className="px-3 py-1 bg-purple-50 border-t border-purple-100 text-[10px] font-mono font-bold text-purple-900">
          &#125; // akhir loop while
        </div>
      </div>
    );
  }

  return null;
};
