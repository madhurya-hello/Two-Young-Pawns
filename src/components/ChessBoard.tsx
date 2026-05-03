import { useEffect, useRef, useState, useCallback } from "react";
import { Chessground } from "chessground";
import { Chess, SQUARES } from "chess.js";
import type { Config } from "chessground/config";
import type { Api } from "chessground/api";
import type { Key } from "chessground/types";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

interface ChessBoardProps {
  moveHistory: string[];
  onMove: (history: string[], pgn: string) => void;
  currentViewIndex: number;
  onGameOver?: (outcome: "win" | "loss" | "draw") => void;
  isPlaying: boolean;
  playerColor: "white" | "black";
  startingFen?: string;
  onFenChange: (fen: string) => void;
  currentPgn: string;
  whiteTime: number;
  blackTime: number;
  opponentRating?: number;
  timeControl?: string;
}

const ChessBoard = ({
  moveHistory,
  onMove,
  currentViewIndex,
  onGameOver,
  isPlaying,
  playerColor,
  startingFen,
  onFenChange,
  currentPgn,
  whiteTime,
  blackTime,
  opponentRating = 1500,
  timeControl,
}: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isEngineMoveRef = useRef(false);

  // Safely initialize with PGN if it exists so we don't lose comments on mount
  const chessRef = useRef<Chess>(new Chess());
  const isInitializedRef = useRef(false);

  // Load the actual data once
  if (!isInitializedRef.current) {
    if (currentPgn) chessRef.current.loadPgn(currentPgn);
    else if (startingFen) chessRef.current.load(startingFen);
    isInitializedRef.current = true;
  }

  // Keep a fresh reference to the clocks for the move events
  const whiteTimeRef = useRef(whiteTime);
  const blackTimeRef = useRef(blackTime);
  useEffect(() => {
    whiteTimeRef.current = whiteTime;
  }, [whiteTime]);
  useEffect(() => {
    blackTimeRef.current = blackTime;
  }, [blackTime]);

  const viewIndexRef = useRef(currentViewIndex);
  const onMoveRef = useRef(onMove);
  const onGameOverRef = useRef(onGameOver);

  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    viewIndexRef.current = currentViewIndex;
    onMoveRef.current = onMove;
    onGameOverRef.current = onGameOver;
  }, [currentViewIndex, onMove, onGameOver]);

  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0);

  const formatClk = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `[%clk ${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}]`;
  };

  const getDests = useCallback((chessInstance: Chess) => {
    const dests = new Map<Key, Key[]>();
    SQUARES.forEach((s) => {
      const ms = chessInstance.moves({ square: s, verbose: true });
      if (ms.length)
        dests.set(
          s as Key,
          ms.map((m) => m.to as Key),
        );
    });
    return dests;
  }, []);

  const askStockfish = useCallback(() => {
    // If we are viewing the past, rewind the master board to branch the timeline FIRST
    if (viewIndexRef.current < chessRef.current.history().length) {
      const movesToUndo =
        chessRef.current.history().length - viewIndexRef.current;
      for (let i = 0; i < movesToUndo; i++) chessRef.current.undo();
      onMoveRef.current(chessRef.current.history(), chessRef.current.pgn());
    }

    if (chessRef.current.isGameOver()) return;
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage(`position fen ${chessRef.current.fen()}`);
      worker.postMessage("go depth 10");
    }
  }, []);

  const multiPvScoresRef = useRef<number[]>([]);
  const lastHighWaitMoveRef = useRef<number>(-10);
  const timeoutRef = useRef<number | null>(null);

  // The Wait Time Calculator
  const getWaitTime = (
    moveNumber: number,
    timeControlStr: string,
    cpScores: number[],
    remainingTime: number, // in seconds
    lastHighMove: number,
  ): { finalWait: number; wasHigh: boolean } => {
    // Fixed early moves
    if (moveNumber === 1) return { finalWait: 1, wasHigh: false };
    if (moveNumber >= 2 && moveNumber <= 5) {
      return { finalWait: timeControlStr === "1+0" ? 1 : 2, wasHigh: false };
    }

    // Calculate Centipawn difference category
    let waitCategory = "low";
    if (cpScores.length >= 2) {
      const diff = Math.abs(cpScores[0] - cpScores[1]);
      // Thresholds: smaller difference = higher wait
      if (diff <= 30) waitCategory = "super high";
      else if (diff <= 80) waitCategory = "high";
      else if (diff <= 200) waitCategory = "medium";
      else waitCategory = "low";
    }

    // Gap check (at least 5 moves between high/super high waits)
    let wasHigh = false;
    if (waitCategory === "high" || waitCategory === "super high") {
      if (moveNumber - lastHighMove < 5) {
        waitCategory = "medium"; // Downgrade the wait
      } else {
        wasHigh = true;
      }
    }

    // Time Control Map
    const rules: Record<
      string,
      {
        low: number;
        med: number;
        high: number;
        super: number;
        under: number;
        max: number;
      }
    > = {
      "15+10": { low: 5, med: 10, high: 30, super: 70, under: 30, max: 10 },
      "10+5": { low: 3, med: 8, high: 20, super: 60, under: 15, max: 5 },
      "10+0": { low: 3, med: 5, high: 20, super: 60, under: 20, max: 2 },
      "5+3": { low: 3, med: 5, high: 15, super: 50, under: 15, max: 5 },
      "5+0": { low: 3, med: 5, high: 15, super: 35, under: 20, max: 2 },
      "3+2": { low: 3, med: 5, high: 10, super: 20, under: 15, max: 5 },
      "3+0": { low: 3, med: 4, high: 8, super: 20, under: 20, max: 2 },
      "2+1": { low: 2, med: 4, high: 8, super: 15, under: 15, max: 3 },
      "1+0": { low: 2, med: 3, high: 5, super: 10, under: 10, max: 1 },
    };

    const rule = rules[timeControlStr] || rules["10+0"]; // default to 10+0 if custom

    let intendedWait = rule.low;
    if (waitCategory === "medium") intendedWait = rule.med;
    if (waitCategory === "high") intendedWait = rule.high;
    if (waitCategory === "super high") intendedWait = rule.super;

    // Clamping logic: maxAllowedWait dynamically limits the wait so they are never left with less than (threshold - max)
    let maxAllowedWait = remainingTime - rule.under + rule.max;

    // If they are strictly under the threshold already:
    if (remainingTime <= rule.under) maxAllowedWait = rule.max;
    maxAllowedWait = Math.max(0.5, maxAllowedWait); // safety fallback

    const finalWait = Math.min(intendedWait, maxAllowedWait);

    return { finalWait, wasHigh };
  };

  // Setup Worker
  useEffect(() => {
    const worker = new Worker("/stockfish-18-lite-single.js");
    workerRef.current = worker;
    worker.postMessage("uci");
    worker.postMessage("isready");

    // Enable MultiPV to analyze the top 2 moves so we can calculate Centipawn differences
    worker.postMessage("setoption name MultiPV value 2");

    worker.onmessage = (e) => {
      const msg = e.data;

      // Extract CP or Mate scores from MultiPV output
      if (msg.startsWith("info") && msg.includes("score")) {
        const pvMatch = msg.match(/multipv\s+(\d+)/);
        if (pvMatch) {
          const index = parseInt(pvMatch[1], 10) - 1; // multipv 1 -> index 0

          const cpMatch = msg.match(/score\s+cp\s+(-?\d+)/);
          const mateMatch = msg.match(/score\s+mate\s+(-?\d+)/);

          if (cpMatch) {
            multiPvScoresRef.current[index] = parseInt(cpMatch[1], 10);
          } else if (mateMatch) {
            // Treat mate as an overwhelming centipawn advantage (10,000)
            multiPvScoresRef.current[index] = 10000;
          }
        }
      }

      if (msg.startsWith("bestmove")) {
        const parts = msg.split(" ");
        const moveStr = parts[1];
        if (moveStr) {
          // Calculate which turn the engine is currently on
          const engineMoveNumber =
            Math.floor(chessRef.current.history().length / 2) + 1;
          const timeControlStr = timeControl || "10+0";
          const opponentRemainingTime =
            playerColor === "white"
              ? blackTimeRef.current
              : whiteTimeRef.current;

          // Process the Star Rule
          const { finalWait, wasHigh } = getWaitTime(
            engineMoveNumber,
            timeControlStr,
            multiPvScoresRef.current,
            opponentRemainingTime,
            lastHighWaitMoveRef.current,
          );

          if (wasHigh) lastHighWaitMoveRef.current = engineMoveNumber;

          // Clear scores for the next move analysis
          multiPvScoresRef.current = [];

          // Wait before playing
          timeoutRef.current = window.setTimeout(() => {
            try {
              if (!isPlayingRef.current) return;
              if (chessRef.current.isGameOver()) return;

              const move = chessRef.current.move(moveStr);
              if (move) {
                const movedColor =
                  chessRef.current.turn() === "b" ? "white" : "black";
                const timeToLog =
                  movedColor === "white"
                    ? whiteTimeRef.current
                    : blackTimeRef.current;
                chessRef.current.setComment(formatClk(timeToLog));

                onMoveRef.current(
                  chessRef.current.history(),
                  chessRef.current.pgn(),
                );

                viewIndexRef.current = chessRef.current.history().length;

                cgRef.current?.move(move.from, move.to);

                setGameUpdateTrigger((prev) => prev + 1);

                if (chessRef.current.isCheckmate()) {
                  onGameOverRef.current?.("loss");
                } else if (chessRef.current.isDraw()) {
                  onGameOverRef.current?.("draw");
                }

                // Yield the thread for 50ms to let the engine's move render before forcing the premove animation to begin.
                setTimeout(() => {
                  // Ensure the game didn't end from the engine's move
                  if (chessRef.current.isGameOver()) return;

                  cgRef.current?.set({
                    turnColor: playerColor,
                    movable: {
                      color: playerColor,
                      dests: getDests(chessRef.current),
                    },
                  });

                  if (
                    typeof (cgRef.current as any)?.playPremove === "function"
                  ) {
                    (cgRef.current as any).playPremove();
                  }
                }, 50);
              }
            } catch (err) {
              console.error("Stockfish move error:", err);
            }
          }, finalWait * 1000);
        }
      }
    };

    return () => {
      worker.terminate();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [timeControl]); // Re-bind if time control changes

  // Dynamically update Stockfish Skill Level when the opponent changes
  useEffect(() => {
    if (workerRef.current) {
      const eloToLevel: Record<number, number> = {
        700: 0,
        1000: 1,
        1250: 2,
        1500: 3,
        1750: 6,
        1900: 9,
        2250: 12,
        2550: 15,
        2850: 20,
      };
      // If it's a custom rating somehow not in the list, fallback to level 5.
      const calculatedLevel = eloToLevel[opponentRating] ?? 5;

      workerRef.current.postMessage(
        `setoption name Skill Level value ${calculatedLevel}`,
      );
    }
  }, [opponentRating]);

  // Initialize Chessground (Once)
  useEffect(() => {
    if (!boardRef.current) return;

    // Determine the correct visual FEN based on current view index
    const initialViewChess = new Chess();
    if (currentPgn) initialViewChess.loadPgn(currentPgn);
    else if (startingFen) initialViewChess.load(startingFen);

    const movesToUndo =
      initialViewChess.history().length - viewIndexRef.current;
    for (let i = 0; i < Math.max(0, movesToUndo); i++) {
      initialViewChess.undo();
    }

    // Use the synced view FEN and dynamic orientation
    const config: Config = {
      fen: initialViewChess.fen(),
      orientation: playerColor,
      animation: { enabled: true, duration: 250 },
      premovable: {
        enabled: true,
        showDests: true,
        castle: true,
      },
      movable: {
        color: "white",
        free: false,
        dests: getDests(chessRef.current),
      },
      events: {
        move: (orig, dest) => {
          // Skip if the game is already over
          if (chessRef.current.isGameOver()) return;
          try {
            // Prevent rewinds during live premoves
            if (
              !isPlayingRef.current &&
              viewIndexRef.current < chessRef.current.history().length
            ) {
              const movesToUndo =
                chessRef.current.history().length - viewIndexRef.current;
              for (let i = 0; i < movesToUndo; i++) chessRef.current.undo();
            }

            const move = chessRef.current.move({
              from: orig,
              to: dest,
              promotion: "q",
            });

            if (move) {
              const movedColor =
                chessRef.current.turn() === "b" ? "white" : "black";
              const timeToLog =
                movedColor === "white"
                  ? whiteTimeRef.current
                  : blackTimeRef.current;
              chessRef.current.setComment(formatClk(timeToLog));

              onMoveRef.current(
                chessRef.current.history(),
                chessRef.current.pgn(),
              );

              // synchronously track the head
              viewIndexRef.current = chessRef.current.history().length;

              setGameUpdateTrigger((prev) => prev + 1);

              if (chessRef.current.isCheckmate()) {
                onGameOverRef.current?.("win");
              } else if (chessRef.current.isDraw()) {
                onGameOverRef.current?.("draw");
              }
            }
          } catch (e) {
            cgRef.current?.set({ fen: chessRef.current.fen() });
          }
        },
      },
    };

    cgRef.current = Chessground(boardRef.current, config);
    return () => cgRef.current?.destroy();
  }, []);

  // Synchronize Board View (Navigation and Live Moves)
  useEffect(() => {
    if (!cgRef.current) return;

    const syncChess = new Chess();
    if (currentPgn) syncChess.loadPgn(currentPgn);
    else if (startingFen) syncChess.load(startingFen);

    const movesToUndo = syncChess.history().length - viewIndexRef.current;
    for (let i = 0; i < Math.max(0, movesToUndo); i++) {
      syncChess.undo();
    }

    const isAtLiveHead =
      viewIndexRef.current === chessRef.current.history().length;
    const activeChess = isAtLiveHead ? chessRef.current : syncChess;

    let movableColor: "white" | "black" | "both" | undefined;
    let movableDests: Map<Key, Key[]> | undefined;

    if (!isPlaying) {
      movableColor = "both";
      movableDests = getDests(activeChess);
    } else {
      movableColor = playerColor;
      const isPlayerTurn =
        activeChess.turn() === (playerColor === "white" ? "w" : "b");
      movableDests = isPlayerTurn ? getDests(activeChess) : undefined;
    }

    const configToSet: Config = {
      orientation: playerColor,
      movable: {
        color: movableColor,
        dests: movableDests,
      },
      turnColor: activeChess.turn() === "w" ? "white" : "black",
    };

    if (!isAtLiveHead) {
      configToSet.fen = activeChess.fen();
      configToSet.lastMove = undefined;
    }

    cgRef.current.set(configToSet);
    onFenChange(syncChess.fen());
  }, [
    currentViewIndex,
    gameUpdateTrigger,
    getDests,
    playerColor,
    isPlaying,
    startingFen,
    currentPgn,
  ]);

  // Auto-trigger Stockfish when Playing
  useEffect(() => {
    const stockfishColor = playerColor === "white" ? "b" : "w";

    // Calculate the turn of the currently viewed position
    const viewTurn = currentViewIndex % 2 === 0 ? "w" : "b";

    if (
      isPlaying &&
      viewTurn === stockfishColor &&
      !chessRef.current.isGameOver()
    ) {
      const timer = setTimeout(() => {
        askStockfish();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [
    isPlaying,
    gameUpdateTrigger,
    askStockfish,
    playerColor,
    currentViewIndex,
  ]);

  return <div ref={boardRef} style={{ width: "100%", height: "100%" }} />;
};

export default ChessBoard;
