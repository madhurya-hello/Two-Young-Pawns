import { useState } from "react";
import Tiles from "../components/Tiles";

const Home = () => {
  const [showModal, setShowModal] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const containerStyle: React.CSSProperties = {
    backgroundColor: "#ffffff", // Changed from dark to white
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#121212", // Dark text for contrast
    transition: "background-color 0.3s ease",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "12px 24px",
    cursor: "pointer",
    border: "1px solid #121212",
    background: "none",
    fontWeight: "bold",
    marginTop: "20px",
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowModal(false);
      setIsExiting(false);
    }, 300);
  };

  return (
    <div style={containerStyle}>
      <h1 style={{ fontSize: "3rem", margin: 0 }}>Chess Lobby</h1>
      <p style={{ opacity: 0.7 }}>A modern place to play</p>
      {!showModal && (
        <button onClick={() => setShowModal(true)} style={buttonStyle}>
          CHANGE TIME CONTROL
        </button>
      )}

      {showModal && <Tiles onClose={handleClose} isExiting={isExiting} />}
    </div>
  );
};

export default Home;
