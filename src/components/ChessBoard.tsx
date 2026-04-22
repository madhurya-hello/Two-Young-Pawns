import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (!boardRef.current) return;

    const getDests = () => {
      const dests = new Map();
      SQUARES.forEach((s) => {
        const ms = chess.moves({ square: s, verbose: true });
        if (ms.length) dests.set(s, ms.map((m) => m.to));
      });
      return dests;
    };

    const config: Config = {
      fen: chess.fen(),
      turnColor: chess.turn() === "w" ? "white" : "black",
      animation: { enabled: true, duration: 200 },
      movable: {
        color: chess.turn() === "w" ? "white" : "black",
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
                turnColor: chess.turn() === "w" ? "white" : "black",
                movable: {
                  color: chess.turn() === "w" ? "white" : "black",
                  dests: getDests(),
                },
              });
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
  }, [chess, onMove]);

  return <div ref={boardRef} style={{ width: "100%", height: "100%" }} />;
};

export default ChessBoard;