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
}

const ChessBoard = ({ onMove, currentViewIndex }: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const cgRef = useRef<Api | null>(null);
  const workerRef = useRef<Worker | null>(null);
  
  // Use a ref for the Chess instance to prevent effect re-runs on mutation
  const chessRef = useRef(new Chess());
  const [gameUpdateTrigger, setGameUpdateTrigger] = useState(0);

  const getDests = useCallback(() => {
    const dests = new Map();
    SQUARES.forEach((s) => {
      const ms = chessRef.current.moves({ square: s, verbose: true });
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

  // 1. Setup Worker
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
              // FIX: Use .move() for smooth animation
              cgRef.current?.move(move.from, move.to);
              // Trigger state sync for turn/movable state
              setGameUpdateTrigger(prev => prev + 1);
            }
          } catch (err) {
            console.error("Stockfish move error:", err);
          }
        }
      }
    };

    return () => worker.terminate();
  }, [onMove]);

  // 2. Initialize Chessground (Once)
  useEffect(() => {
    if (!boardRef.current) return;

    const config: Config = {
      fen: chessRef.current.fen(),
      orientation: "white",
      animation: { enabled: true, duration: 250 },
      movable: {
        color: "white",
        free: false,
        dests: getDests(),
      },
      events: {
        move: (orig, dest) => {
          try {
            const move = chessRef.current.move({ from: orig, to: dest, promotion: "q" });
            if (move) {
              onMove(chessRef.current.history());
              setGameUpdateTrigger(prev => prev + 1);
              setTimeout(askStockfish, 250);
            }
          } catch (e) {
            // Revert illegal move
            cgRef.current?.set({ fen: chessRef.current.fen() });
          }
        },
      },
    };

    cgRef.current = Chessground(boardRef.current, config);
    return () => cgRef.current?.destroy();
  }, []); // Empty dependency array: only init once

  // 3. Synchronize Board View (Navigation and Live Moves)
  useEffect(() => {
    if (!cgRef.current) return;

    const history = chessRef.current.history();
    const isAtLatestMove = currentViewIndex === history.length;
    
    let displayFen: string;

    if (isAtLatestMove) {
      displayFen = chessRef.current.fen();
    } else {
      // Create a temporary board to find the historical FEN
      const tempChess = new Chess();
      for (let i = 0; i < currentViewIndex; i++) {
        tempChess.move(history[i]);
      }
      displayFen = tempChess.fen();
    }

    // Update the board
    cgRef.current.set({
      fen: displayFen,
      lastMove: undefined, // Optional: clear highlights during scrub
      movable: {
        color: isAtLatestMove ? (chessRef.current.turn() === 'w' ? "white" : "black") : undefined,
        dests: isAtLatestMove ? getDests() : new Map(),
      },
      turnColor: isAtLatestMove ? (chessRef.current.turn() === 'w' ? "white" : "black") : undefined,
    });
  }, [currentViewIndex, gameUpdateTrigger, getDests]);

  return <div ref={boardRef} style={{ width: "100%", height: "100%" }} />;
};

export default ChessBoard;