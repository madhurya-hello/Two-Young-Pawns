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
  const [whiteTime, setWhiteTime] = useState(215999);
  const [blackTime, setBlackTime] = useState(215999);
  const [increment, setIncrement] = useState(0);
  const prevHistoryLengthRef = useRef(0);
  const [gameOutcome, setGameOutcome] = useState<"win" | "loss" | null>(null);
  const [showOutcomeOverlay, setShowOutcomeOverlay] = useState(false);
  const [isOutcomeExiting, setIsOutcomeExiting] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");
  const [startingFen, setStartingFen] = useState(
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  );
  const [currentFen, setCurrentFen] = useState(startingFen);
  const [currentPgn, setCurrentPgn] = useState("");
  const [startTotalTime, setStartTotalTime] = useState(215999);
  const [timeControlMoveIndex, setTimeControlMoveIndex] = useState(0);
  const currentClocksRef = useRef({ wt: startTotalTime, bt: startTotalTime });

  // Keep the ref synced with the live clock while playing
  useEffect(() => {
    if (isPlaying) {
      currentClocksRef.current = { wt: whiteTime, bt: blackTime };
    }
  }, [whiteTime, blackTime, isPlaying]);

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
              setGameOutcome(playerColor === "white" ? "loss" : "win");
              setShowOutcomeOverlay(true);
              currentClocksRef.current = { wt: 0, bt: currentClocksRef.current.bt };
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime((prev) => {
            if (prev <= 1) {
              setIsPlaying(false);
              setGameOutcome(playerColor === "black" ? "loss" : "win");
              setShowOutcomeOverlay(true);
              currentClocksRef.current = { wt: currentClocksRef.current.wt, bt: 0 };
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => window.clearInterval(interval);
  }, [isPlaying, moveHistory.length, playerColor]);

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

  const handleMove = (history: string[], pgn: string = "") => {
    setMoveHistory(history);
    setCurrentViewIndex(history.length);
    if (pgn) setCurrentPgn(pgn);
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
    setStartTotalTime(totalSeconds);
    setIncrement(incSeconds);
    setGameOutcome(null);
    handleCloseOutcome();
    setTimeControlMoveIndex(moveHistory.length);

    handleClose();
  };

  const handleReset = () => {
    setMoveHistory([]);
    setCurrentViewIndex(0);
    setCurrentPgn("");
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
      setStartTotalTime(totalSeconds);
      setTimeControlMoveIndex(0);
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
      setCurrentPgn("");
      setGameOutcome(null);
      handleCloseOutcome();
      setIsPlaying(false);
      setTimeControlMoveIndex(0);

      // Remount ChessBoard with the new FEN!
      setBoardKey((prev) => prev + 1);
    } catch (e) {
      alert("Invalid FEN string");
    }
  };

  const handleLoadPgn = (pgnString: string) => {
    try {
      const tempChess = new Chess();
      tempChess.loadPgn(pgnString);
      const history = tempChess.history();

      while (tempChess.undo()) {}
      const startFen = tempChess.fen();

      // Extract Headers
      const extractHeader = (key: string) => {
        const match = pgnString.match(new RegExp(`\\[${key}\\s+"([^"]*)"\\]`));
        return match ? match[1] : null;
      };

      const wName = extractHeader("White");
      const bName = extractHeader("Black");
      const wElo = extractHeader("WhiteElo");
      const bElo = extractHeader("BlackElo");
      const tc = extractHeader("TimeControl");

      let pColor: "white" | "black" = "white";
      let oppName = "Opponent";
      let oppRating = 1500;

      // Identify who the opponent is
      if (wName === "You") {
        pColor = "white";
        oppName = bName || "Opponent";
        oppRating = parseInt(bElo || "1500", 10);
      } else if (bName === "You") {
        pColor = "black";
        oppName = wName || "Opponent";
        oppRating = parseInt(wElo || "1500", 10);
      } else {
        if (wName) oppName = wName;
        if (wElo) oppRating = parseInt(wElo, 10);
      }

      setPlayerColor(pColor);
      if (oppName !== "Opponent" || wName) {
        setSelectedOpponent({ name: oppName, image: "", rating: oppRating });
      }

      // Reconstruct Time Control
      let parsedStartTotal = 215999;
      if (tc && tc !== "-") {
        setSelectedTime({ time: tc, type: "Custom" });
        let totalSeconds = 0;
        const timeStr = tc.toLowerCase().trim();
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
        if (totalSeconds > 0) parsedStartTotal = totalSeconds;
      }

      setWhiteTime(parsedStartTotal);
      setBlackTime(parsedStartTotal);
      setStartTotalTime(parsedStartTotal);
      setStartingFen(startFen);
      setMoveHistory(history);
      setCurrentViewIndex(0);
      setCurrentPgn(pgnString);
      setIsPlaying(false);
      setGameOutcome(null);
      handleCloseOutcome();
      setTimeControlMoveIndex(0);
      setBoardKey((prev) => prev + 1);
    } catch (e) {
      alert("Invalid PGN file structure.");
    }
  };

  // Parses the PGN clock tags to visually update the clock during navigation
  useEffect(() => {
    if (!isPlaying && currentPgn && currentViewIndex > 0) {
      const matches = [...currentPgn.matchAll(/\[%clk\s+(\d+):(\d+):(\d+)\]/g)];
      const parsedClocks = matches.map(
        (m) =>
          parseInt(m[1], 10) * 3600 +
          parseInt(m[2], 10) * 60 +
          parseInt(m[3], 10),
      );

      if (parsedClocks.length > 0) {
        let wt = startTotalTime;
        let bt = startTotalTime;

        for (let i = 0; i < currentViewIndex; i++) {
          if (i === timeControlMoveIndex) {
            wt = startTotalTime;
            bt = startTotalTime;
          }
          if (i < parsedClocks.length) {
            if (i % 2 === 0) wt = parsedClocks[i];
            else bt = parsedClocks[i];
          }
        }

        if (currentViewIndex === timeControlMoveIndex) {
          wt = startTotalTime;
          bt = startTotalTime;
        }

        // If we are at the very end of a completed game, use our latched final timers.
        if (gameOutcome && currentViewIndex === moveHistory.length) {
          setWhiteTime(currentClocksRef.current.wt);
          setBlackTime(currentClocksRef.current.bt);
        } else {
          setWhiteTime(wt);
          setBlackTime(bt);
        }
      }
    }
  }, [
    currentViewIndex,
    isPlaying,
    currentPgn,
    startTotalTime,
    timeControlMoveIndex,
    gameOutcome, 
    moveHistory.length
  ]);

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
                moveHistory={moveHistory}
                isPlaying={isPlaying}
                playerColor={playerColor}
                onMove={handleMove}
                currentViewIndex={currentViewIndex}
                onGameOver={(outcome) => {
                  setIsPlaying(false);
                  setGameOutcome(outcome);
                  setShowOutcomeOverlay(true);
                  currentClocksRef.current = { wt: whiteTime, bt: blackTime };
                }}
                startingFen={startingFen}
                onFenChange={setCurrentFen}
                currentPgn={currentPgn}
                whiteTime={whiteTime}
                blackTime={blackTime}
                opponentRating={selectedOpponent?.rating || 1500}
                timeControl={selectedTime?.time}
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
          currentPgn={currentPgn}
          onLoadPgn={handleLoadPgn}
          playerColor={playerColor}
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
