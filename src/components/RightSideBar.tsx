import React, { useState, useRef } from "react";

interface RightSideBarProps {
  moveHistory: string[];
  currentViewIndex: number;
  onJumpToMove: (index: number) => void;
  onOpenModal: () => void;
  onOpenOpponentModal: () => void;
  selectedOpponent: { name: string; image: string; rating: number } | null;
  selectedTime: { time: string; type: string } | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  gameOutcome: "win" | "loss" | "draw" | null;
  onReset: () => void;
  onFlip: () => void;
  currentFen: string;
  onLoadFen: (fen: string) => void;
  currentPgn: string;
  onLoadPgn: (pgn: string) => void;
  playerColor: "white" | "black";
  onResign: () => void;
  onDraw: () => void;
  isOpponentTurn: boolean;
  drawOfferedThisMove: boolean;
}

const RightSideBar: React.FC<RightSideBarProps> = ({
  moveHistory,
  currentViewIndex,
  onJumpToMove,
  onOpenModal,
  onOpenOpponentModal,
  selectedOpponent,
  selectedTime,
  isPlaying,
  onTogglePlay,
  gameOutcome,
  onReset,
  onFlip,
  currentFen,
  onLoadFen,
  currentPgn,
  onLoadPgn,
  playerColor,
  onResign,
  onDraw,
  isOpponentTurn,
  drawOfferedThisMove,
}) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredMove, setHoveredMove] = useState<number | null>(null);
  const isGameReady = Boolean(selectedOpponent && selectedTime);
  const canFlip = moveHistory.length === 0;
  const [isCopied, setIsCopied] = useState(false);
  const [fenInput, setFenInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sidebarStyle: React.CSSProperties = {
    width: "25%",
    height: "100%",
    backgroundColor: "#f9f9f9",
    borderLeft: "1px solid #eeeeee",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    boxSizing: "border-box",
  };

  const getButtonStyle = (
    id: string,
  ): React.CSSProperties => ({
    width: "100%",
    padding: "12px 16px",
    cursor: "pointer",
    border: "1px solid #e0e0e0",
    background: hoveredBtn === id ? "#f3f3f3" : "#fff",
    color: "#333",
    fontWeight: "600",
    borderRadius: "8px",
    fontSize: "0.85rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "all 0.2s ease",
    outline: "none",
  });

  const buttonGroupStyle: React.CSSProperties = {
    display: "flex",
    gap: "10px",
  };

  const iconStyle = {
    width: "18px",
    height: "18px",
    opacity: 0.7,
  };

  const tableContainerStyle: React.CSSProperties = {
    marginTop: "10px",
    flexGrow: 1,
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    backgroundColor: "#fff",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  };

  const scrollAreaStyle: React.CSSProperties = {
    overflowY: "auto",
    flexGrow: 1,
  };

  const tableStyle: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "0.9rem",
    tableLayout: "fixed",
  };

  const controlsSectionStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 16px",
    borderBottom: "1px solid #eee",
    position: "sticky",
    top: 0,
    backgroundColor: "#fafafa",
    zIndex: 10,
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: "#fafafa",
    padding: "12px 16px",
    textAlign: "left",
    borderBottom: "1px solid #eee",
    color: "#888",
    fontWeight: "500",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 16px",
    borderBottom: "1px solid #f8f8f8",
  };

  const rows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    rows.push({
      moveNo: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1] || "",
    });
  }

  return (
    <div style={sidebarStyle}>
      {/* Row 2: Opponent and Time Control (Side by Side) */}
      <div style={buttonGroupStyle}>
        <button
          style={{ ...getButtonStyle("opponent"), flex: 1 }}
          onClick={onOpenOpponentModal}
          onMouseEnter={() => setHoveredBtn("opponent")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>

          {/* Show player name and rating if selected, otherwise show "Opponent" */}
          {selectedOpponent
            ? `${selectedOpponent.name} (${selectedOpponent.rating})`
            : "Opponent"}
        </button>

        <button
          style={{ ...getButtonStyle("time"), flex: 1 }}
          onClick={onOpenModal}
          onMouseEnter={() => setHoveredBtn("time")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {selectedTime
            ? `${selectedTime.type} (${selectedTime.time})`
            : "Time"}
        </button>
      </div>

      {/* Row 3: New and Continue (Side by Side) */}
      <div style={buttonGroupStyle}>
        <button
          style={{
            ...getButtonStyle("cont"),
            flex: 1,
            opacity: isGameReady ? 1 : 0.5,
            cursor: isGameReady ? "pointer" : "not-allowed",
          }}
          disabled={!isGameReady}
          onClick={onTogglePlay}
          onMouseEnter={() => isGameReady && setHoveredBtn("cont")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          {isPlaying ? (
            <svg style={iconStyle} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg style={iconStyle} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {isPlaying ? "Pause" : "Play"}
        </button>

        <button
          style={{
            ...getButtonStyle("new"),
            flex: 1,
            opacity: 1,
            cursor: "pointer",
          }}
          onClick={onReset}
          onMouseEnter={() => setHoveredBtn("new")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New
        </button>
      </div>

      {/* Row 4: Flip, Draw, Resign (Side by Side) */}
      <div style={buttonGroupStyle}>
        <button
          style={{
            ...getButtonStyle("flip"),
            flex: 1,
            padding: "8px 4px",
            gap: "4px",
            fontSize: "0.75rem",
            opacity: canFlip ? 1 : 0.5,
            cursor: canFlip ? "pointer" : "not-allowed",
          }}
          disabled={!canFlip}
          onClick={onFlip}
          onMouseEnter={() => canFlip && setHoveredBtn("flip")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Flip
        </button>

        {/* Draw Button */}
        {(() => {
          const canDraw = isPlaying && !isOpponentTurn && !drawOfferedThisMove;
          return (
            <button
              style={{
                ...getButtonStyle("draw"),
                flex: 1,
                padding: "8px 4px",
                gap: "4px",
                fontSize: "0.75rem",
                opacity: canDraw ? 1 : 0.5,
                cursor: canDraw ? "pointer" : "not-allowed",
              }}
              disabled={!canDraw}
              onClick={onDraw}
              onMouseEnter={() => canDraw && setHoveredBtn("draw")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <span
                style={{
                  ...iconStyle,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  fontWeight: "bold",
                }}
              >
                ½
              </span>
              Draw
            </button>
          );
        })()}

        {/* Resign Button */}
        {(() => {
          const canResign = isPlaying;
          return (
            <button
              style={{
                ...getButtonStyle("resign"),
                flex: 1,
                padding: "8px 4px",
                gap: "4px",
                fontSize: "0.75rem",
                opacity: canResign ? 1 : 0.5,
                cursor: canResign ? "pointer" : "not-allowed",
              }}
              disabled={!canResign}
              onClick={onResign}
              onMouseEnter={() => canResign && setHoveredBtn("resign")}
              onMouseLeave={() => setHoveredBtn(null)}
            >
              <svg
                style={iconStyle}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
              Resign
            </button>
          );
        })()}
      </div>

      {/* Row 5: PGN and FEN Input */}
      <div style={buttonGroupStyle}>
        {/* PGN Import Button */}
        <input
          type="file"
          accept=".pgn"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (content) onLoadPgn(content);
            };
            reader.readAsText(file);
            e.target.value = ""; // Reset input so the same file can be loaded again
          }}
        />
        <button
          style={{
            ...getButtonStyle("pgn"),
            flex: "0 0 calc((100% - 20px) / 3)",
            padding: "8px 4px",
            gap: "4px",
            fontSize: "0.75rem",
          }}
          onClick={() => fileInputRef.current?.click()} // Triggers hidden file input
          onMouseEnter={() => setHoveredBtn("pgn")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <svg
            style={iconStyle}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          PGN
        </button>

        {/* FEN Input + Load Button */}
        <div
          style={{
            flex: 1,
            display: "flex",
            borderRadius: "8px",
            border: "1px solid #e0e0e0",
            overflow: "hidden",
            backgroundColor: "#fff",
            borderColor:
              hoveredBtn === "fenInput" || hoveredBtn === "loadFen"
                ? "#ccc"
                : "#e0e0e0",
            transition: "border-color 0.2s ease",
            opacity: isPlaying ? 0.6 : 1,
          }}
          onMouseEnter={() => setHoveredBtn("fenInput")}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <input
            type="text"
            placeholder="Enter FEN"
            value={fenInput}
            onChange={(e) => setFenInput(e.target.value)}
            disabled={isPlaying}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "8px 10px",
              fontSize: "0.75rem",
              width: "100%",
              backgroundColor: "transparent",
              cursor: isPlaying ? "not-allowed" : "text",
            }}
          />
          <button
            disabled={isPlaying || !fenInput.trim()}
            onClick={() => {
              onLoadFen(fenInput.trim());
            }}
            style={{
              background: hoveredBtn === "loadFen" ? "#e6e6e6" : "#f3f3f3",
              border: "none",
              borderLeft: "1px solid #e0e0e0",
              padding: "0 12px",
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#333",
              transition: "background 0.2s ease",
              cursor: isPlaying || !fenInput.trim() ? "not-allowed" : "pointer",
              opacity: isPlaying || !fenInput.trim() ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              setHoveredBtn("loadFen");
            }}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            Load
          </button>
        </div>
      </div>

      <div style={tableContainerStyle}>
        {/* Integrated Control Header */}
        <div style={controlsSectionStyle}>
          <div style={{ display: "flex", gap: "10px" }}>
            {/* Skip Backward */}
            <button
              style={{
                background:
                  hoveredBtn === "skipbackward" ? "#ececec" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
              }}
              onMouseEnter={() => setHoveredBtn("skipbackward")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => onJumpToMove(0)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.6 }}
              >
                <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            {/* Rewind */}
            <button
              style={{
                background: hoveredBtn === "rewind" ? "#ececec" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
              }}
              onMouseEnter={() => setHoveredBtn("rewind")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => onJumpToMove(Math.max(0, currentViewIndex - 1))}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.6 }}
              >
                <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            {/* Fast Forward */}
            <button
              style={{
                background:
                  hoveredBtn === "fastforward" ? "#ececec" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
              }}
              onMouseEnter={() => setHoveredBtn("fastforward")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() =>
                onJumpToMove(Math.min(moveHistory.length, currentViewIndex + 1))
              }
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.6 }}
              >
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
            {/* Skip Forward */}
            <button
              style={{
                background: hoveredBtn === "skip" ? "#ececec" : "transparent",
                border: "none",
                cursor: "pointer",
                padding: "2px",
              }}
              onMouseEnter={() => setHoveredBtn("skip")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => onJumpToMove(moveHistory.length)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ opacity: 0.6 }}
              >
                <path d="M5 6v12l8.5-6L5 6zm7 0v12l8.5-6-8.5-6z" />
              </svg>
            </button>
          </div>

          {/* Copy FEN & Download PGN */}
          <div style={{ display: "flex", gap: "5px" }}>
            {/* Copy FEN Button */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background:
                  hoveredBtn === "copyFen" ? "#ecececf8" : "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: isCopied ? "#3b82f6" : "#666",
                padding: "4px 8px",
                borderRadius: "4px",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={() => setHoveredBtn("copyFen")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => {
                navigator.clipboard.writeText(currentFen).then(() => {
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                });
              }}
            >
              {isCopied ? (
                // Blue Checkmark Icon
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                // Standard Copy Icon
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
              FEN
            </button>

            {/* Download PGN Button */}
            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: hoveredBtn === "dl" ? "#ecececf8" : "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "0.75rem",
                fontWeight: "600",
                color: "#666",
                padding: "4px 8px",
                borderRadius: "4px",
              }}
              onMouseEnter={() => setHoveredBtn("dl")}
              onMouseLeave={() => setHoveredBtn(null)}
              onClick={() => {
                if (!currentPgn) return;

                let finalPgn = currentPgn;

                // Calculate Standard PGN Result
                let result = "*";
                if (gameOutcome === "draw") {
                  result = "1/2-1/2";
                } else if (gameOutcome === "win") {
                  result = playerColor === "white" ? "1-0" : "0-1";
                } else if (gameOutcome === "loss") {
                  result = playerColor === "white" ? "0-1" : "1-0";
                }

                if (finalPgn.includes('[White "?"]')) {
                  const wName =
                    playerColor === "white"
                      ? "You"
                      : selectedOpponent?.name || "You";
                  const bName =
                    playerColor === "black"
                      ? "You"
                      : selectedOpponent?.name || "You";
                  const wElo =
                    playerColor === "white"
                      ? "1500"
                      : selectedOpponent?.rating?.toString() || "1500";
                  const bElo =
                    playerColor === "black"
                      ? "1500"
                      : selectedOpponent?.rating?.toString() || "1500";
                  const tc = selectedTime ? selectedTime.time : "-";
                  const dateStr = new Date()
                    .toISOString()
                    .split("T")[0]
                    .replace(/-/g, ".");

                  finalPgn = finalPgn
                    .replace(/\[Event "\?"\]/, `[Event "Casual Game"]`)
                    .replace(/\[Site "\?"\]/, `[Site "Local"]`)
                    .replace(
                      /\[Date "\?\?\?\?\.\?\?\.\?\?"\]/,
                      `[Date "${dateStr}"]`,
                    )
                    .replace(/\[Round "\?"\]/, `[Round "-"]`)
                    .replace(
                      /\[White "\?"\]/,
                      `[White "${wName}"]\n[WhiteElo "${wElo}"]`,
                    )
                    .replace(
                      /\[Black "\?"\]/,
                      `[Black "${bName}"]\n[BlackElo "${bElo}"]\n[TimeControl "${tc}"]`,
                    )
                    .replace(/\[Result "\*"\]/, `[Result "${result}"]`);
                }

                // chess.js automatically adds a `*` at the very end of the move text if it considers the game unfinished.
                // If we have a definitive result (like from a timeout), we should swap the trailing `*` for the actual score.
                if (result !== "*") {
                  finalPgn = finalPgn.replace(/\*\s*$/, result);
                }

                const blob = new Blob([finalPgn], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = selectedOpponent
                  ? `game_vs_${selectedOpponent.name.replace(/\s+/g, "_")}.pgn`
                  : "chess_game.pgn";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
            >
              <svg
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              PGN
            </button>
          </div>
        </div>

        {/* Table Header */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: "50px" }}>#</th>
              <th style={thStyle}>White</th>
              <th style={thStyle}>Black</th>
            </tr>
          </thead>
        </table>

        {/* Table Body */}
        <div style={scrollAreaStyle}>
          <table style={tableStyle}>
            <tbody>
              {rows.map((row, index) => {
                // Calculate the exact move index for white and black
                const whiteMoveIndex = index * 2 + 1;
                const blackMoveIndex = index * 2 + 2;
                const hasBlackMove = Boolean(row.black);

                return (
                  <tr key={row.moveNo}>
                    {/* Move Number Column (Not Interactive) */}
                    <td
                      style={{
                        ...tdStyle,
                        color: "#aaa",
                        width: "50px",
                        fontWeight: "500",
                      }}
                    >
                      {row.moveNo}
                    </td>

                    {/* White's Move Cell */}
                    <td
                      onMouseEnter={() => setHoveredMove(whiteMoveIndex)}
                      onMouseLeave={() => setHoveredMove(null)}
                      onClick={() => onJumpToMove(whiteMoveIndex)}
                      style={{
                        ...tdStyle,
                        fontWeight: "500",
                        cursor: "pointer",
                        borderRadius: "4px",
                        backgroundColor:
                          currentViewIndex === whiteMoveIndex
                            ? "#f5f5f5"
                            : hoveredMove === whiteMoveIndex
                              ? "#f5f5f5"
                              : "transparent",
                        transition: "background-color 0.1s ease",
                      }}
                    >
                      {row.white}
                    </td>

                    {/* Black's Move Cell */}
                    <td
                      onMouseEnter={() =>
                        hasBlackMove && setHoveredMove(blackMoveIndex)
                      }
                      onMouseLeave={() => setHoveredMove(null)}
                      onClick={() =>
                        hasBlackMove && onJumpToMove(blackMoveIndex)
                      }
                      style={{
                        ...tdStyle,
                        fontWeight: "500",
                        cursor: hasBlackMove ? "pointer" : "default",
                        borderRadius: "4px",
                        backgroundColor:
                          hasBlackMove && currentViewIndex === blackMoveIndex
                            ? "#f5f5f5"
                            : hoveredMove === blackMoveIndex
                              ? "#f5f5f5"
                              : "transparent",
                        transition: "background-color 0.1s ease",
                      }}
                    >
                      {row.black}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;
