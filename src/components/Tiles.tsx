import React, { useEffect, useState } from "react";

interface TileData {
  time: string;
  type: string;
}

const timeControls: TileData[] = [
  { time: "1+0", type: "Bullet" },
  { time: "2+1", type: "Bullet" },
  { time: "3+0", type: "Bullet" },
  { time: "3+2", type: "Blitz" },
  { time: "5+0", type: "Blitz" },
  { time: "5+3", type: "Blitz" },
  { time: "10+0", type: "Rapid" },
  { time: "10+5", type: "Rapid" },
  { time: "15+10", type: "Rapid" },
];

const Tile = ({
  control,
  onClick,
  index,
}: {
  control: TileData;
  onClick: () => void;
  index: number;
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const isLastColumn = (index + 1) % 3 === 0;
  const isLastRow = index >= 9;

  const tileStyle: React.CSSProperties = {
    position: "relative",
    aspectRatio: "1 / 1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#ffffff",
    backgroundColor: "transparent",
    borderRight: isLastColumn ? "none" : "1px solid rgba(255, 255, 255, 0.15)",
    borderBottom: isLastRow ? "none" : "1px solid rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
    transition: "background-color 0.3s ease",
  };

  const gradientOverlay: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: "none",
    background: isHovered
      ? `radial-gradient(circle 350px at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.15), transparent)`
      : "transparent",
    transition: "background 0.1s ease",
  };

  return (
    <div
      style={tileStyle}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={gradientOverlay} />
      <div style={{ fontSize: "2.2rem", fontWeight: "600", zIndex: 1 }}>
        {control.time}
      </div>
      <div
        style={{
          fontSize: "1.1rem",
          opacity: 0.5,
          textTransform: "uppercase",
          letterSpacing: "1px",
          zIndex: 1,
        }}
      >
        {control.type}
      </div>
    </div>
  );
};

interface TilesProps {
  onClose: () => void;
  isExiting: boolean;
  onSelect: (control: TileData) => void;
}

const Tiles: React.FC<TilesProps> = ({ onClose, isExiting, onSelect }) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    opacity: isMounted && !isExiting ? 1 : 0,
    transition: "opacity 300ms ease-in-out",
    pointerEvents: isExiting ? "none" : "auto",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(3, 220px)",
    gap: 0,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    transform: isMounted && !isExiting ? "scale(1)" : "scale(0.95)",
    transition: "transform 300ms ease-in-out",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={gridStyle} onClick={(e) => e.stopPropagation()}>
        {timeControls.map((control, index) => (
          <Tile
            key={index}
            index={index}
            control={control}
            onClick={() => onSelect(control)}
          />
        ))}
      </div>
    </div>
  );
};

export default Tiles;
