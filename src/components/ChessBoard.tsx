import { useEffect, useRef, useState, useCallback } from "react";
import { Chessground } from "chessground";
import { Chess, SQUARES } from "chess.js";
import type { Config } from "chessground/config";
import type { Api } from "chessground/api";

import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";

interface ChessBoardProps {
  onMove: (history: string[]) => void;
  currentViewIndex: number;
  onGameOver?: (outcome: "win" | "loss") => void;
  isPlaying: boolean;
  playerColor: "white" | "black";
}

const ChessBoard = ({
  onMove,
  currentViewIndex,
  onGameOver,
  isPlaying,
  playerColor,
}: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Use a ref for the Chess instance to prevent effect re-runs on mutation
  const chessRef = useRef(new Chess());
  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0);

  const viewIndexRef = useRef(currentViewIndex);

  useEffect(() => {
    viewIndexRef.current = currentViewIndex;
  }, [currentViewIndex]);

  const getDests = useCallback((chessInstance: Chess) => {
    // <-- ADD chessInstance PARAM
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
              onMove(chessRef.current.history());
              cgRef.current?.move(move.from, move.to);
              setGameUpdateTrigger((prev) => prev + 1);
              if (chessRef.current.isCheckmate()) {
                onGameOver?.("loss");
              }
            }
          } catch (err) {
            console.error("Stockfish move error:", err);
          }
        }
      }
    };

    return () => worker.terminate();
  }, [onMove]);

  // Initialize Chessground (Once)
  useEffect(() => {
    if (!boardRef.current) return;

    const config: Config = {
      fen: chessRef.current.fen(),
      orientation: "white",
      animation: { enabled: true, duration: 250 },
      movable: {
        color: "white",
        free: false,
        dests: getDests(chessRef.current),
      },
      events: {
        move: (orig, dest) => {
          try {
            const currentIdx = viewIndexRef.current;
            const history = chessRef.current.history();

            // If user is making a move in the past, truncate the history
            if (currentIdx < history.length) {
              const branchChess = new Chess();
              for (let i = 0; i < currentIdx; i++) {
                branchChess.move(history[i]);
              }
              // Overwrite main game state
              chessRef.current = branchChess;
            }

            const move = chessRef.current.move({
              from: orig,
              to: dest,
              promotion: "q",
            });
            if (move) {
              onMove(chessRef.current.history());
              setGameUpdateTrigger((prev) => prev + 1);

              if (chessRef.current.isCheckmate()) {
                onGameOver?.("win");
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

    const history = chessRef.current.history();

    // Rebuild the chess instance for the CURRENT view (whether past or present)
    const viewChess = new Chess();
    for (let i = 0; i < currentViewIndex; i++) {
      viewChess.move(history[i]);
    }

    // Determine who is allowed to drag pieces
    let movableColor: "white" | "black" | "both" | undefined;

    if (!isPlaying) {
      movableColor = "both";
    } else {
      // When playing, restrict to the user's chosen color for the CURRENT turn
      movableColor =
        viewChess.turn() === (playerColor === "white" ? "w" : "b")
          ? playerColor
          : undefined;
    }

    // Update the board
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
  }, [currentViewIndex, gameUpdateTrigger, getDests, playerColor, isPlaying]);

  // Auto-trigger Stockfish when Playing
  useEffect(() => {
    // Determine which color stockfish should be playing
    const stockfishColor = playerColor === "white" ? "b" : "w";

    if (
      isPlaying &&
      chessRef.current.turn() === stockfishColor &&
      !chessRef.current.isGameOver()
    ) {
      const timer = setTimeout(() => {
        askStockfish();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, gameUpdateTrigger, askStockfish, playerColor]);

  return <div ref={boardRef} style={{ width: "100%", height: "100%" }} />;
};

export default ChessBoard;
