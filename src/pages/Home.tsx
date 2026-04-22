import { useState } from "react";
import Tiles from "../components/Tiles";
import ChessBoard from "../components/ChessBoard"; 

const Home = () => {
  const [showModal, setShowModal] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setIsExiting(false);
    }, 300);
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
    width: "92%",
    maxWidth: "1400px",
    height: "93%",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
    border: "1px solid #e0e0e0",
  };

  const leftSectionStyle: React.CSSProperties = {
    width: "30%",
    height: "100%",
    backgroundColor: "#f9f9f9",
    borderRight: "1px solid #eeeeee",
    padding: "32px",
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  };

  const rightSectionStyle: React.CSSProperties = {
    width: "70%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  };

  const boardAreaStyle: React.CSSProperties = {
    width: "100%",
    maxWidth: "75vh",
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

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    cursor: "pointer",
    border: "1px solid #121212",
    background: "none",
    fontWeight: "700",
    marginTop: "auto",
    borderRadius: "8px",
    fontSize: "0.9rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const boardContainerStyle: React.CSSProperties = {
    width: "100%",
    aspectRatio: "1 / 1",
    border: "1px solid #12121200",
    borderRadius: "4px",
    overflow: "hidden",
  };

  return (
    <div style={screenContainerStyle}>
      <div style={appContainerStyle}>

        {/* Left Side: Analysis Area */}
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

          {!showModal && (
            <button onClick={() => setShowModal(true)} style={buttonStyle}>
              Change Time Control
            </button>
          )}
        </div>

        {/* Right Side: Board Area */}
        <div style={rightSectionStyle}>
          <div style={boardAreaStyle}>
            {/* Top Player Info (Opponent) */}
            <div style={playerRowStyle}>
              <div>
                <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>
                  Magnus Carlsen
                </span>
                <span
                  style={{
                    marginLeft: "8px",
                    opacity: 0.5,
                    fontSize: "0.9rem",
                  }}
                >
                  (2830)
                </span>
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontWeight: "700",
                  fontSize: "1.3rem",
                }}
              >
                00:10:00
              </div>
            </div>
            {/* Chess Component Container */}
            <div style={boardContainerStyle}>
              <ChessBoard onMove={setMoveHistory} />
            </div>
            {/* Bottom Player Info (User) */}
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
                }}
              >
                00:10:00
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && <Tiles onClose={handleClose} isExiting={isExiting} />}
    </div>
  );
};

export default Home;