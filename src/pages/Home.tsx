import { useEffect, useState, useRef } from "react";
import Tiles from "../components/Tiles";
import ChessBoard from "../components/ChessBoard";
import RightSideBar from "../components/RightSideBar";
import OpponentModal from "../components/OpponentModal";
import { Chess } from "chess.js";

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
  const [gameOutcome, setGameOutcome] = useState<"win" | "loss" | null>(null);
  const [showOutcomeOverlay, setShowOutcomeOverlay] = useState(false);
  const [isOutcomeExiting, setIsOutcomeExiting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [startingFen, setStartingFen] = useState("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
  const [currentFen, setCurrentFen] = useState(startingFen);

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
    }

    // Sync the tracker so branching doesn't break future increments
    prevHistoryLengthRef.current = moveHistory.length;
  }, [moveHistory.length, increment]);

  useEffect(() => {
    let interval: number;

    if (isPlaying) {
      interval = window.setInterval(() => {
        const isWhiteTurn = moveHistory.length % 2 === 0;
        if (isWhiteTurn) {
          setWhiteTime((prev) => {
            if (prev <= 1) {
              setIsPlaying(false);
              setGameOutcome("loss");
              setShowOutcomeOverlay(true);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              setIsPlaying(false);
              setGameOutcome("win");
              setShowOutcomeOverlay(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => window.clearInterval(interval);
  }, [isPlaying, moveHistory.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(event.target as Node)
      ) {
        handleCloseOutcome();
      }
    };

    if (showOutcomeOverlay) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOutcomeOverlay]);

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
    setGameOutcome(null);
    handleCloseOutcome();

    handleClose();
  };

  const handleReset = () => {
    setMoveHistory([]);
    setCurrentViewIndex(0);
    setGameOutcome(null);
    handleCloseOutcome();
    setIsPlaying(false);
    setBoardKey((prev) => prev + 1);
    setStartingFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");

    if (selectedTime) {
      let totalSeconds = 0;
      const timeStr = selectedTime.time.toLowerCase().trim();
      if (timeStr.includes("+")) {
        const [mins] = timeStr.split("+");
        totalSeconds = parseInt(mins, 10) * 60;
      } else if (timeStr.includes(":")) {
        const [m, s] = timeStr.split(":");
        totalSeconds = parseInt(m || "0", 10) * 60 + parseInt(s || "0", 10);
      } else if (timeStr.includes("sec")) {
        totalSeconds = parseInt(timeStr, 10);
      } else {
        totalSeconds = parseInt(timeStr, 10) * 60;
      }
      setWhiteTime(totalSeconds);
      setBlackTime(totalSeconds);
    }
  };

  const handleCloseOutcome = () => {
    setIsOutcomeExiting(true);
    setTimeout(() => {
      setShowOutcomeOverlay(false);
      setIsOutcomeExiting(false);
    }, 300);
  };

  const handleLoadFen = (fen: string) => {
    try {
      // validation to ensure it's a valid FEN before breaking the board
      new Chess(fen);
      
      setStartingFen(fen);
      setMoveHistory([]);
      setCurrentViewIndex(0);
      setGameOutcome(null);
      handleCloseOutcome();
      setIsPlaying(false);

      // Remount ChessBoard with the new FEN!
      setBoardKey((prev) => prev + 1); 
    } catch (e) {
      alert("Invalid FEN string");
    }
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
    position: "relative",
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
    position: "relative",
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
            {/* Top Row: Opponent */}
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
                  color:
                    (playerColor === "white" ? blackTime : whiteTime) < 20
                      ? "#ef4444"
                      : "inherit",
                }}
              >
                {/* Show opponent's time */}
                {formatTime(playerColor === "white" ? blackTime : whiteTime)}
              </div>
            </div>

            <div style={boardContainerStyle}>
              <ChessBoard
                key={boardKey}
                isPlaying={isPlaying}
                playerColor={playerColor}
                onMove={handleMove}
                currentViewIndex={currentViewIndex}
                onGameOver={(outcome) => {
                  setIsPlaying(false);
                  setGameOutcome(outcome);
                  setShowOutcomeOverlay(true);
                }}
                startingFen={startingFen}
                onFenChange={setCurrentFen}
              />
            </div>

            {/* Bottom Row: You */}
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
                  color:
                    (playerColor === "white" ? whiteTime : blackTime) < 20
                      ? "#ef4444"
                      : "inherit",
                }}
              >
                {/* Show your time */}
                {formatTime(playerColor === "white" ? whiteTime : blackTime)}
              </div>
            </div>
          </div>

          {showOutcomeOverlay && gameOutcome && (
            <>
              {/* Inject CSS Keyframes */}
              <style>
                {`
                @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeOutOverlay { from { opacity: 1; } to { opacity: 0; } }
                @keyframes popInText { 
                  0% { transform: scale(0.5); opacity: 0; } 
                  80% { transform: scale(1.05); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; } 
                }
                @keyframes popOutText { 
                  from { transform: scale(1); opacity: 1; } 
                  to { transform: scale(0.5); opacity: 0; } 
                }
              `}
              </style>

              <div
                ref={overlayRef}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor:
                    gameOutcome === "win"
                      ? "rgba(0, 255, 42, 0.3)"
                      : "rgba(255, 0, 0, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                  // Apply the fade animation to the overlay background
                  animation: isOutcomeExiting
                    ? "fadeOutOverlay 0.3s forwards"
                    : "fadeInOverlay 0.3s forwards",
                }}
              >
                <div
                  style={{
                    color: "white",
                    fontSize: "5rem",
                    fontWeight: "bold",
                    textShadow: "0px 4px 20px rgba(0,0,0,0.3)", // Added a slight shadow for extra pop
                    // Apply the pop animation to the text itself
                    animation: isOutcomeExiting
                      ? "popOutText 0.3s forwards"
                      : "popInText 0.4s ease-out forwards",
                  }}
                >
                  {gameOutcome === "win" ? "You Won" : "You Lost"}
                </div>
              </div>
            </>
          )}
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
          gameOutcome={gameOutcome}
          onReset={handleReset}
          onFlip={() =>
            setPlayerColor((prev) => (prev === "white" ? "black" : "white"))
          }
          currentFen={currentFen}
          onLoadFen={handleLoadFen}
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
