import { useEffect, useState, useRef } from "react";
import Tiles from "../components/Tiles";
import ChessBoard from "../components/ChessBoard";
import RightSideBar from "../components/RightSideBar";
import OpponentModal from "../components/OpponentModal";

const Home = () => {
  const [showModal, setShowModal] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [showOpponentModal, setShowOpponentModal] = useState(false);
  const [isOpponentExiting, setIsOpponentExiting] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<{
    name: string;
    image: string;
    rating: number;
  } | null>(null);
  const [selectedTime, setSelectedTime] = useState<{
    time: string;
    type: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [whiteTime, setWhiteTime] = useState(30);
  const [blackTime, setBlackTime] = useState(30);
  const [increment, setIncrement] = useState(0);
  const prevHistoryLengthRef = useRef(0);

  useEffect(() => {
    // If game resets, reset the tracker
    if (moveHistory.length === 0) {
      prevHistoryLengthRef.current = 0;
      return;
    }

    // If a new move was made, apply the increment
    if (moveHistory.length > prevHistoryLengthRef.current) {
      if (moveHistory.length % 2 === 1) {
        setWhiteTime((prev) => prev + increment);
      } else {
        setBlackTime((prev) => prev + increment);
      }
      prevHistoryLengthRef.current = moveHistory.length;
    }
  }, [moveHistory.length, increment]);

  useEffect(() => {
    let interval: number;

    if (isPlaying) {
      interval = window.setInterval(() => {
        const isWhiteTurn = moveHistory.length % 2 === 0;
        if (isWhiteTurn) {
          setWhiteTime((prev) => (prev > 0 ? prev - 1 : 0));
        } else {
          setBlackTime((prev) => (prev > 0 ? prev - 1 : 0));
        }
      }, 1000);
    }

    return () => window.clearInterval(interval);
  }, [isPlaying, moveHistory.length]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setIsExiting(false);
    }, 300);
  };

  const handleMove = (history: string[]) => {
    setMoveHistory(history);
    setCurrentViewIndex(history.length);
    if (!isPlaying) setIsPlaying(true);
  };

  const handleCloseOpponent = () => {
    setIsOpponentExiting(true);
    setTimeout(() => {
      setShowOpponentModal(false);
      setIsOpponentExiting(false);
    }, 300);
  };

  const handleSelectOpponent = (player: {
    name: string;
    image: string;
    rating: number;
  }) => {
    setSelectedOpponent(player);
    handleCloseOpponent();
  };

  const handleSelectTime = (control: { time: string; type: string }) => {
    setSelectedTime(control);

    let totalSeconds = 0;
    let incSeconds = 0;
    const timeStr = control.time.toLowerCase().trim();

    if (timeStr.includes("+")) {
      const [mins, inc] = timeStr.split("+");
      totalSeconds = parseInt(mins, 10) * 60;
      incSeconds = parseInt(inc || "0", 10);
    } else if (timeStr.includes(":")) {
      const [m, s] = timeStr.split(":");
      totalSeconds = parseInt(m || "0", 10) * 60 + parseInt(s || "0", 10);
    } else if (timeStr.includes("sec")) {
      totalSeconds = parseInt(timeStr, 10);
    } else {
      totalSeconds = parseInt(timeStr, 10) * 60;
    }

    setIsPlaying(false);
    setWhiteTime(totalSeconds);
    setBlackTime(totalSeconds);
    setIncrement(incSeconds);

    handleClose();
  };

  const screenContainerStyle: React.CSSProperties = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
    color: "#121212",
  };

  const appContainerStyle: React.CSSProperties = {
    display: "flex",
    width: "96%",
    maxWidth: "1700px",
    height: "93%",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    border: "1px solid #e0e0e0",
  };

  const leftSectionStyle: React.CSSProperties = {
    width: "25%",
    height: "100%",
    backgroundColor: "#f9f9f9",
    borderRight: "1px solid #eeeeee",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    boxSizing: "border-box",
  };

  const rightSectionStyle: React.CSSProperties = {
    width: "50%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    boxSizing: "border-box",
  };

  const boardAreaStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "77vh",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const playerRowStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 0",
  };

  const boardContainerStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    borderRadius: "4px",
    overflow: "hidden",
  };

  return (
    <div style={screenContainerStyle}>
      <div style={appContainerStyle}>
        {/* Analysis Area */}
        <div style={leftSectionStyle}>
          <div>
            <h2 style={{ margin: "0 0 12px 0", fontSize: "1.6rem" }}>
              Analysis
            </h2>
            <div
              style={{ opacity: 0.6, fontSize: "0.95rem", lineHeight: "1.6" }}
            >
              Engine evaluations and move history will appear here during your
              match.
            </div>
          </div>
        </div>

        {/* Center: Board Area */}
        <div style={rightSectionStyle}>
          <div style={boardAreaStyle}>
            <div style={playerRowStyle}>
              <div>
                <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                  {selectedOpponent ? selectedOpponent.name : "Select Opponent"}
                </span>
                {selectedOpponent && (
                  <span
                    style={{
                      marginLeft: "8px",
                      opacity: 0.5,
                      fontSize: "0.9rem",
                    }}
                  >
                    ({selectedOpponent.rating})
                  </span>
                )}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: "700",
                  fontSize: "1.3rem",
                  color: blackTime < 20 ? "#ef4444" : "inherit",
                }}
              >
                {formatTime(blackTime)}
              </div>
            </div>

            <div style={boardContainerStyle}>
              <ChessBoard
                onMove={handleMove}
                currentViewIndex={currentViewIndex}
              />
            </div>

            <div style={playerRowStyle}>
              <div>
                <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                  You
                </span>
                <span
                  style={{
                    marginLeft: "8px",
                    opacity: 0.5,
                    fontSize: "0.9rem",
                  }}
                >
                  (1500)
                </span>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: "700",
                  fontSize: "1.3rem",
                  color: whiteTime < 20 ? "#ef4444" : "inherit",
                }}
              >
                {formatTime(whiteTime)}
              </div>
            </div>
          </div>
        </div>

        {/* Controls and History */}
        <RightSideBar
          moveHistory={moveHistory}
          currentViewIndex={currentViewIndex}
          onJumpToMove={setCurrentViewIndex}
          onOpenModal={() => setShowModal(true)}
          onOpenOpponentModal={() => setShowOpponentModal(true)}
          selectedOpponent={selectedOpponent}
          selectedTime={selectedTime}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
        />
      </div>

      {showModal && (
        <Tiles
          onClose={handleClose}
          isExiting={isExiting}
          onSelect={handleSelectTime}
        />
      )}

      {showOpponentModal && (
        <OpponentModal
          onClose={handleCloseOpponent}
          isExiting={isOpponentExiting}
          onSelect={handleSelectOpponent}
        />
      )}
    </div>
  );
};

export default Home;
