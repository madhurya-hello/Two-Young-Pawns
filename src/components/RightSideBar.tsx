import React, { useState } from "react";

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
}) => {
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const isGameReady = Boolean(selectedOpponent && selectedTime);

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
    isPrimary = false,
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
      {/* Row 1: Import PGN (Full Width) */}
      <button
        style={getButtonStyle("pgn")}
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
        Import PGN
      </button>

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
            /* Pause Icon */
            <svg style={iconStyle} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            /* Play Icon */
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
            opacity: isGameReady ? 1 : 0.5,
            cursor: isGameReady ? "pointer" : "not-allowed",
          }}
          disabled={!isGameReady}
          onMouseEnter={() => isGameReady && setHoveredBtn("new")}
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

          {/* Download Button */}
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
              {rows.map((row, index) => (
                <tr
                  key={row.moveNo}
                  onMouseEnter={() => setHoveredRow(row.moveNo)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onJumpToMove(index * 2 + 1)}
                  style={{
                    backgroundColor:
                      currentViewIndex === index * 2 + 1
                        ? "#ebebeb"
                        : hoveredRow === row.moveNo
                          ? "#f5f5f5"
                          : "transparent",
                    transition: "background-color 0.1s ease",
                    cursor: "pointer",
                  }}
                >
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
                  <td style={{ ...tdStyle, fontWeight: "500" }}>{row.white}</td>
                  <td style={{ ...tdStyle, fontWeight: "500" }}>{row.black}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RightSideBar;
