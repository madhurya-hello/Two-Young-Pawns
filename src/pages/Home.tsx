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
  const turnStartTimeRef = useRef(Date.now());
  const preciseClocksRef = useRef({ w: 215999, b: 215999 });
  const [gameOutcome, setGameOutcome] = useState<
    "win" | "loss" | "draw" | null
  >(null);
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
  const [drawOfferStatus, setDrawOfferStatus] = useState<
    "evaluating" | "accepted" | "rejected" | null
  >(null);
  const [drawOfferedThisMove, setDrawOfferedThisMove] = useState(false);

  // Determine if it is currently the opponent's turn
  const isWhiteTurn = moveHistory.length % 2 === 0;
  const isOpponentTurn =
    isPlaying &&
    ((playerColor === "white" && !isWhiteTurn) ||
      (playerColor === "black" && isWhiteTurn));

  // Keep the exact clocks synced if the game is reset or loaded
  useEffect(() => {
    if (!isPlaying) {
      preciseClocksRef.current = { w: whiteTime, b: blackTime };
    }
  }, [whiteTime, blackTime, isPlaying]);

  // Keep the ref synced with the live clock while playing
  useEffect(() => {
    if (isPlaying) {
      currentClocksRef.current = { wt: whiteTime, bt: blackTime };
    }
  }, [whiteTime, blackTime, isPlaying]);

  useEffect(() => {
    if (moveHistory.length === 0) {
      prevHistoryLengthRef.current = 0;
      return;
    }

    if (moveHistory.length > prevHistoryLengthRef.current) {
      const now = Date.now();
      const elapsedMs = now - turnStartTimeRef.current;

      // Calculate how much time the move SHOULD take
      let enforcedTimeSpent = elapsedMs / 1000;
      if (elapsedMs <= 300) {
        enforcedTimeSpent = 0.5; // Premove
      } else if (elapsedMs < 1000) {
        enforcedTimeSpent = 1.0; // Fast human move
      }

      // The live clock already deducted 'elapsedMs'.
      // We adjust it by the difference + add the increment.
      const adjustment = elapsedMs / 1000 - enforcedTimeSpent + increment;
      const isWhiteMoved = moveHistory.length % 2 === 1;

      if (isWhiteMoved) {
        preciseClocksRef.current.w += adjustment;
        setWhiteTime(Number(preciseClocksRef.current.w.toFixed(1)));
      } else {
        preciseClocksRef.current.b += adjustment;
        setBlackTime(Number(preciseClocksRef.current.b.toFixed(1)));
      }

      // Reset for the opponent's turn
      turnStartTimeRef.current = now;
      prevHistoryLengthRef.current = moveHistory.length;
    }
  }, [moveHistory.length, increment]);

  useEffect(() => {
    let animationFrameId: number;
    let lastTick = Date.now();

    if (isPlaying) {
      // Mark exactly when the turn started if it's a fresh turn
      if (moveHistory.length === prevHistoryLengthRef.current) {
        turnStartTimeRef.current = Date.now();
      }

      const tick = () => {
        const now = Date.now();
        const deltaSec = (now - lastTick) / 1000;
        lastTick = now;

        const isWhiteTurn = moveHistory.length % 2 === 0;

        if (isWhiteTurn) {
          preciseClocksRef.current.w -= deltaSec;
          if (preciseClocksRef.current.w <= 0) {
            preciseClocksRef.current.w = 0;
            setIsPlaying(false);
            setGameOutcome(playerColor === "white" ? "loss" : "win");
            setShowOutcomeOverlay(true);
          }
          setWhiteTime(Number(preciseClocksRef.current.w.toFixed(1)));
        } else {
          preciseClocksRef.current.b -= deltaSec;
          if (preciseClocksRef.current.b <= 0) {
            preciseClocksRef.current.b = 0;
            setIsPlaying(false);
            setGameOutcome(playerColor === "black" ? "loss" : "win");
            setShowOutcomeOverlay(true);
          }
          setBlackTime(Number(preciseClocksRef.current.b.toFixed(1)));
        }

        if (isPlaying) animationFrameId = requestAnimationFrame(tick);
      };

      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
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

  const prevMoveCountRef = useRef(moveHistory.length);

  useEffect(() => {
    if (moveHistory.length !== prevMoveCountRef.current) {
      prevMoveCountRef.current = moveHistory.length;

      const isWhiteTurn = moveHistory.length % 2 === 0;
      const isOppTurn =
        isPlaying &&
        ((playerColor === "white" && !isWhiteTurn) ||
          (playerColor === "black" && isWhiteTurn));

      if (isOppTurn) {
        // As soon as the user plays a move, clear the "rejected" text to show "thinking..."
        setDrawOfferStatus(null);
      } else {
        // A fresh turn for the user starts, allow a new draw offer
        setDrawOfferedThisMove(false);
      }
    }
  }, [moveHistory.length, isPlaying, playerColor]);

  const handleResign = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    setGameOutcome(playerColor === "white" ? "loss" : "win");
    setShowOutcomeOverlay(true);
  };

  const handleDraw = () => {
    if (drawOfferedThisMove || !isPlaying || isOpponentTurn) return;

    setDrawOfferedThisMove(true);
    setDrawOfferStatus("evaluating");

    const startEvalTime = Date.now();
    let evaluationCP = 0;

    // Spin up a quick temporary worker strictly for evaluation
    const worker = new Worker("/stockfish-18-lite-single.js");
    worker.postMessage("uci");
    worker.postMessage("isready");
    worker.postMessage(`position fen ${currentFen}`);
    worker.postMessage("go depth 14");

    worker.onmessage = (e) => {
      const msg = e.data;

      if (msg.includes("score cp")) {
        const match = msg.match(/score cp (-?\d+)/);
        if (match) evaluationCP = parseInt(match[1], 10);
      } else if (msg.includes("score mate")) {
        const match = msg.match(/score mate (-?\d+)/);
        if (match) {
          // If mate is positive, user has forced mate. Negative means user is getting mated.
          evaluationCP = parseInt(match[1], 10) > 0 ? 10000 : -10000;
        }
      }

      if (msg.startsWith("bestmove")) {
        worker.terminate();
        const elapsed = Date.now() - startEvalTime;
        const remainingTime = Math.max(0, 3000 - elapsed); // Enforce at least 3 seconds

        setTimeout(() => {
          let accepted = false;
          const moveCount = Math.floor(moveHistory.length / 2);

          // Evaluation logic (in order)
          if (evaluationCP >= 300) {
            accepted = true;
          } else if (evaluationCP <= -300) {
            accepted = false;
          } else if (moveCount < 10) {
            accepted = false;
          } else if (moveCount > 15) {
            accepted = true;
          } else {
            accepted = false;
          }

          if (accepted) {
            setDrawOfferStatus("accepted");
            setIsPlaying(false);
            setGameOutcome("draw");
            setShowOutcomeOverlay(true);
          } else {
            setDrawOfferStatus("rejected");
          }
        }, remainingTime);
      }
    };
  };

  const formatTime = (seconds: number) => {
    const fixedStr = seconds.toFixed(1);
    const [wholeStr, decimalStr] = fixedStr.split(".");

    const whole = parseInt(wholeStr, 10);
    const h = Math.floor(whole / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((whole % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (whole % 60).toString().padStart(2, "0");

    return h !== "00"
      ? `${h}:${m}:${s}.${decimalStr}`
      : `${m}:${s}.${decimalStr}`;
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
      setDrawOfferStatus(null);
      setDrawOfferedThisMove(false);
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
      setDrawOfferStatus(null);
      setDrawOfferedThisMove(false);

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
      setDrawOfferStatus(null);
      setDrawOfferedThisMove(false);
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
    moveHistory.length,
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
      {/* keyframes for the waving dots */}
      <style>
        {`
          @keyframes waveDot {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-3px); }
          }
        `}
      </style>
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
              <div style={{ display: "flex", alignItems: "center" }}>
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

                {/* Dynamic Status Text */}
                {isOpponentTurn && !drawOfferStatus && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "1rem",
                      color: "#e91f1f",
                      fontStyle: "normal",
                      display: "flex",
                    }}
                  >
                    thinking
                    <span style={{ display: "flex", marginLeft: "2px" }}>
                      <span style={{ animation: "waveDot 1.2s infinite" }}>
                        .
                      </span>
                      <span
                        style={{
                          animation: "waveDot 1.2s infinite",
                          animationDelay: "0.2s",
                        }}
                      >
                        .
                      </span>
                      <span
                        style={{
                          animation: "waveDot 1.2s infinite",
                          animationDelay: "0.4s",
                        }}
                      >
                        .
                      </span>
                    </span>
                  </span>
                )}
                {drawOfferStatus === "evaluating" && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "1rem",
                      color: "#e91f1f",
                      fontStyle: "normal",
                      display: "flex",
                    }}
                  >
                    evaluating draw offer
                    <span style={{ display: "flex", marginLeft: "2px" }}>
                      <span style={{ animation: "waveDot 1.2s infinite" }}>
                        .
                      </span>
                      <span
                        style={{
                          animation: "waveDot 1.2s infinite",
                          animationDelay: "0.2s",
                        }}
                      >
                        .
                      </span>
                      <span
                        style={{
                          animation: "waveDot 1.2s infinite",
                          animationDelay: "0.4s",
                        }}
                      >
                        .
                      </span>
                    </span>
                  </span>
                )}
                {drawOfferStatus === "accepted" && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "1rem",
                      fontStyle: "normal",
                      color: "#10b981",
                      fontWeight: "600",
                    }}
                  >
                    draw offer accepted
                  </span>
                )}
                {drawOfferStatus === "rejected" && (
                  <span
                    style={{
                      marginLeft: "12px",
                      fontSize: "1rem",
                      color: "#e91f1f",
                      fontStyle: "normal",
                      fontWeight: "600",
                    }}
                  >
                    draw offer rejected
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
                      : gameOutcome === "loss"
                        ? "rgba(255, 0, 0, 0.3)"
                        : "rgba(128, 128, 128, 0.5)",
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
                  {gameOutcome === "win"
                    ? "You Won"
                    : gameOutcome === "loss"
                      ? "You Lost"
                      : "Game Drawn"}
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
          onResign={handleResign}
          onDraw={handleDraw}
          isOpponentTurn={isOpponentTurn}
          drawOfferedThisMove={drawOfferedThisMove}
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
