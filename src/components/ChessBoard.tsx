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
}

const ChessBoard = ({ onMove }: ChessBoardProps) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [chess] = useState(new Chess());
  const cgRef = useRef<Api | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const getDests = useCallback(() => {
    const dests = new Map();
    SQUARES.forEach((s) => {
      const ms = chess.moves({ square: s, verbose: true });
      if (ms.length) dests.set(s, ms.map((m) => m.to));
    });
    return dests;
  }, [chess]);

  const askStockfish = useCallback(() => {
    if (chess.isGameOver()) return;
    const worker = workerRef.current;
    if (worker) {
      worker.postMessage(`position fen ${chess.fen()}`);
      worker.postMessage("go depth 10");
    }
  }, [chess]);

  useEffect(() => {
    const worker = new Worker("/stockfish-18-lite-single.js");
    workerRef.current = worker;
    worker.postMessage("uci");
    worker.postMessage("setoption name Skill Level value 5");
    worker.postMessage("isready");

    worker.onmessage = (e) => {
      const msg = e.data;
      console.log("Stockfish raw output:", msg);
      if (msg.startsWith("bestmove")) {
        const parts = msg.split(" ");
        const bestMove = parts;
        if (bestMove) {
          try {
            const move = chess.move(bestMove[1]);
            if (move) {
              onMove(chess.history());
              cgRef.current?.set({
                fen: chess.fen(),
                turnColor: "white",
                movable: {
                  color: "white",
                  dests: getDests(),
                },
              });
            }
          } catch (err) {
            console.error("Chess.js rejected the move string:", bestMove, err);
          }
        }
      }
    };

    return () => {
      worker.terminate();
    };
  }, [chess, onMove, getDests]);

  useEffect(() => {
    if (!boardRef.current) return;
    const config: Config = {
      fen: chess.fen(),
      turnColor: "white",
      animation: { enabled: true, duration: 200 },
      movable: {
        color: "white",
        free: false,
        dests: getDests(),
      },
    };

    cgRef.current = Chessground(boardRef.current, config);

    cgRef.current.set({
      events: {
        move: (orig, dest) => {
          try {
            const move = chess.move({ from: orig, to: dest, promotion: "q" });
            if (move) {
              onMove(chess.history());
              cgRef.current?.set({
                fen: chess.fen(),
                turnColor: "black",
                movable: {
                  color: "black",
                  dests: new Map(),
                },
              });
              setTimeout(askStockfish, 250);
            }
          } catch (e) {
            cgRef.current?.set({ fen: chess.fen() });
          }
        },
      },
    });

    return () => {
      cgRef.current?.destroy();
    };
  }, [chess, onMove, getDests, askStockfish]);

  return <div ref={boardRef} style={{ width: "100%", height: "100%" }} />;
};

export default ChessBoard;