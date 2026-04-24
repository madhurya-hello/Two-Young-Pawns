import React, { useEffect, useState } from "react";

interface Opponent {
  name: string;
  rating: number;
  image: string;
}

interface OpponentModalProps {
  onClose: () => void;
  isExiting: boolean;
  onSelect: (player: Opponent) => void;
}

const OpponentModal: React.FC<OpponentModalProps> = ({
  onClose,
  isExiting,
  onSelect,
}) => {
  const [isMounting, setIsMounting] = useState(false);
  const [hoveredOpponent, setHoveredOpponent] = useState<string | null>(null);

  useEffect(() => {
    // Trigger fade-in on mount
    setIsMounting(true);
  }, []);

  const opponents: Opponent[] = [
    { name: "Vihaan", rating: 700, image: "Vihaan.png" },
    { name: "Saanvi", rating: 900, image: "Saanvi.png" },
    { name: "Prakash", rating: 1000, image: "Prakash.png" },
    { name: "Anika", rating: 1200, image: "Anika.png" },
    { name: "Gayatri", rating: 1350, image: "Gayatri.png" },
    { name: "Reyansh", rating: 1600, image: "Reyansh.png" },
    { name: "Myra", rating: 2000, image: "Myra.png" },
    { name: "Atharv", rating: 2550, image: "Atharv.png" },
    { name: "Kailash", rating: 2850, image: "Kailash.png" },
  ];

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    opacity: isMounting && !isExiting ? 1 : 0,
    transition: "opacity 0.3s ease-in-out",
  };

  const modalStyle: React.CSSProperties = {
    padding: "40px",
    width: "95%",
    maxWidth: "900px",
    transform: isMounting && !isExiting ? "scale(1)" : "scale(0.95)",
    transition: "transform 0.3s ease-in-out",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "40px",
    marginTop: "30px",
  };

  const cardStyle = (isHovered: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.2s ease",
    transform: isHovered ? "scale(1.08)" : "scale(1)",
  });

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={gridStyle}>
          {opponents.map((player) => {
            const isHovered = hoveredOpponent === player.name;
            return (
              <div
                key={player.name}
                style={cardStyle(isHovered)}
                onMouseEnter={() => setHoveredOpponent(player.name)}
                onMouseLeave={() => setHoveredOpponent(null)}
                onClick={() => onSelect(player)}
              >
                <img
                  src={`/src/assets/${player.image}`}
                  alt={player.name}
                  style={{
                    width: "160px",
                    height: "160px",
                    borderRadius: "20px",
                    objectFit: "cover",
                    marginBottom: "12px",
                    border: isHovered
                      ? "4px solid #fff"
                      : "2px solid rgba(255,255,255,0.2)",
                    boxShadow: isHovered
                      ? "0 10px 30px rgba(0,0,0,0.5)"
                      : "0 4px 10px rgba(0,0,0,0.2)",
                    transition: "all 0.3s ease",
                  }}
                />
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "1.2rem",
                    color: "white",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  {player.name}
                </div>
                <div
                  style={{
                    fontSize: "0.95rem",
                    color: "#ddd",
                    fontWeight: "500",
                  }}
                >
                  {player.rating} ELO
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OpponentModal;
