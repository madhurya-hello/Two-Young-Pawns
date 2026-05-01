import { useEffect, useRef, useState, useCallback } from "react";
import { Chessground } from "chessground";
import { Chess, SQUARES } from "chess.js";
import type { Config } from "chessground/config";
import type { Api } from "chessground/api";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

interface ChessBoardProps {
  moveHistory: string[];
  onMove: (history: string[], pgn: string) => void;
  currentViewIndex: number;
  onGameOver?: (outcome: "win" | "loss") => void;
  isPlaying: boolean;
  playerColor: "white" | "black";
  startingFen?: string;
  onFenChange: (fen: string) => void;
  currentPgn: string;
  whiteTime: number;
  blackTime: number;
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
    const dests = new Map();
    SQUARES.forEach((s) => {
      const ms = chessInstance.moves({ square: s, verbose: true });
      if (ms.length)
        dests.set(
          s,
          ms.map((m) => m.to),
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

  // Setup Worker
  useEffect(() => {
    const worker = new Worker("/stockfish-18-lite-single.js");
    workerRef.current = worker;
    worker.postMessage("uci");
    worker.postMessage("setoption name Skill Level value 5");
    worker.postMessage("isready");

    worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.startsWith("bestmove")) {
        const parts = msg.split(" ");
        const moveStr = parts[1];
        if (moveStr) {
          try {
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
              isEngineMoveRef.current = true;
              cgRef.current?.move(move.from, move.to);
              isEngineMoveRef.current = false;
              setGameUpdateTrigger((prev) => prev + 1);
              if (chessRef.current.isCheckmate()) {
                onGameOverRef.current?.("loss");
              }
            }
          } catch (err) {
            console.error("Stockfish move error:", err);
          }
        }
      }
    };

    return () => worker.terminate();
  }, []);

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
      movable: {
        color: "white",
        free: false,
        dests: getDests(chessRef.current),
      },
      events: {
        move: (orig, dest) => {
          // Skip if Stockfish is making the move
          if (isEngineMoveRef.current) return;
          try {
            // If making a move in the past, safely rewind the master engine
            if (viewIndexRef.current < chessRef.current.history().length) {
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
              setGameUpdateTrigger((prev) => prev + 1);

              if (chessRef.current.isCheckmate()) {
                onGameOverRef.current?.("win");
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

    // Use a temporary board for navigation so we don't wipe the master engine's comments
    const viewChess = new Chess();
    if (currentPgn) viewChess.loadPgn(currentPgn);
    else if (startingFen) viewChess.load(startingFen);

    const movesToUndo = viewChess.history().length - currentViewIndex;
    for (let i = 0; i < Math.max(0, movesToUndo); i++) {
      viewChess.undo();
    }

    let movableColor: "white" | "black" | "both" | undefined;
    if (!isPlaying) {
      movableColor = "both";
    } else {
      movableColor =
        viewChess.turn() === (playerColor === "white" ? "w" : "b")
          ? playerColor
          : undefined;
    }

    cgRef.current.set({
      fen: viewChess.fen(),
      orientation: playerColor,
      lastMove: undefined,
      movable: {
        color: movableColor,
        dests: getDests(viewChess),
      },
      turnColor: viewChess.turn() === "w" ? "white" : "black",
    });

    onFenChange(viewChess.fen());
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
