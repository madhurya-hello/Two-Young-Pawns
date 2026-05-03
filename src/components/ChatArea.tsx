import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  id: string;
  text: string;
  sender: "user" | "opponent";
}

interface ChatAreaProps {
  moveHistory: string[];
  currentFen: string;
  startingFen: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const ChatArea: React.FC<ChatAreaProps> = ({ moveHistory, currentFen, startingFen }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const openingTemplates = [
    "We’ve entered the {opening_name}. A classical battlefield with plenty of hidden ideas. Let’s see how well you navigate it.",
    "Ah, the {opening_name}. Solid, ambitious, and full of tactical possibilities. Things are about to get interesting.",
    "Looks like we’re playing the {opening_name}. A favorite among aggressive players who enjoy putting pressure early.",
    "The {opening_name} is now on the board. One inaccurate move here can completely shift the momentum.",
    "We just stepped into the {opening_name}. This opening has challenged masters for generations — your turn now.",
    "Interesting choice — the {opening_name}. It often leads to sharp middlegames and creative plans.",
    "The game has transposed into the {opening_name}. Time to see whether strategy or calculation wins today.",
    "Welcome to the {opening_name}. A deceptively simple opening that can become very dangerous very quickly.",
    "The {opening_name} has appeared on the board. Let’s find out who understands the resulting positions better.",
    "We’re officially in {opening_name} territory now. Every move from here starts telling a story.",
  ];

  useEffect(() => {
    if (moveHistory.length === 10) {
      const identifyOpening = async () => {
        setIsTyping(true);
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

          // Hidden prompt strictly asking for the name
          const hiddenPrompt = `Here are the first few moves of a chess game: ${moveHistory.join(" ")}. Identify the name of this opening. Reply ONLY with the exact opening name (e.g., "Sicilian Defense", "Queen's Gambit"). Do not include any punctuation, quotes, or conversational text.`;

          const result = await model.generateContent(hiddenPrompt);
          const openingName = result.response.text().trim();

          // Pick a random template and insert the opening name
          const randomTemplate =
            openingTemplates[
              Math.floor(Math.random() * openingTemplates.length)
            ];
          const finalMessageText = randomTemplate.replace(
            "{opening_name}",
            openingName,
          );

          const aiMsg: Message = {
            id: Date.now().toString(),
            text: finalMessageText,
            sender: "opponent",
          };

          setMessages((prev) => [...prev, aiMsg]);
        } catch (error) {
          console.error("Error identifying opening:", error);
        } finally {
          setIsTyping(false);
        }
      };

      identifyOpening();
    }
  }, [moveHistory.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText.trim();

    // Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: "user",
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }

    // Trigger typing animation
    setIsTyping(true);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Construct a hidden, context-rich prompt for Gemini
      const movesText =
        moveHistory.length > 0
          ? moveHistory.join(" ")
          : "No prior moves (started from this exact position).";

      const contextualPrompt = `You are an expert chess coach and analyst. The analysis started from this position (FEN): ${startingFen} . Moves played from that starting position: ${movesText} . Current board position (FEN): ${currentFen} ;
      
      The user is asking you a question about the current position: "${userText}"
      
      Answer their question accurately based on the current FEN and move history. Keep your answer concise (maximum of 3 sentences), conversational, and helpful. Do not mention that you were given the FEN or move history, just answer the question naturally.`;

      // Send the contextual prompt instead of just the userText
      const result = await model.generateContent(contextualPrompt);
      const response = await result.response;
      const text = response.text();

      // Add AI response to the chat
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: "opponent",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (error) {
      console.error("Error fetching from Gemini:", error);
      // Fallback message if the API fails
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I am having trouble connecting to the server right now.",
        sender: "opponent",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;

      if (textareaRef.current.scrollHeight > 120) {
        textareaRef.current.style.overflowY = "auto";
      } else {
        textareaRef.current.style.overflowY = "hidden";
      }
    }
  };

  // --- Styles ---
  const containerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)",
  };

  const headerStyle: React.CSSProperties = {
    padding: "16px",
    borderBottom: "1px solid #eeeeee",
    backgroundColor: "#fafafa",
    fontWeight: "600",
    color: "#333",
    fontSize: "1.1rem",
  };

  const messageListStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: "16px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  };

  const inputAreaStyle: React.CSSProperties = {
    display: "flex",
    padding: "12px",
    borderTop: "1px solid #eeeeee",
    backgroundColor: "#fafafa",
    gap: "8px",
    alignItems: "flex-end",
  };

  const inputStyle: React.CSSProperties = {
    flexGrow: 1,
    padding: "10px 14px",
    borderRadius: "12px",
    border: "1px solid #cccccc",
    outline: "none",
    fontSize: "0.9rem",
    lineHeight: "1.4",
    resize: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
    minHeight: "40px",
    maxHeight: "120px",
    overflowY: "hidden",
  };

  const sendButtonStyle: React.CSSProperties = {
    padding: "10px 16px",
    height: "fit-content",
    borderRadius: "20px",
    border: "none",
    backgroundColor: inputText.trim() ? "#2563eb" : "#a1a1aa",
    color: "#ffffff",
    fontWeight: "600",
    cursor: inputText.trim() ? "pointer" : "not-allowed",
    transition: "background-color 0.2s",
  };

  const getBubbleStyle = (
    sender: "user" | "opponent",
  ): React.CSSProperties => ({
    maxWidth: "75%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "0.95rem",
    lineHeight: "1.4",
    alignSelf: sender === "user" ? "flex-end" : "flex-start",
    backgroundColor: sender === "user" ? "#2563eb" : "#f1f5f9",
    color: sender === "user" ? "#ffffff" : "#333333",
    borderBottomRightRadius: sender === "user" ? "4px" : "16px",
    borderBottomLeftRadius: sender === "opponent" ? "4px" : "16px",
    wordBreak: "break-word",
    whiteSpace: "pre-wrap",
  });

  return (
    <div style={containerStyle}>
      <style>
        {`
          @keyframes chatWaveDot {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-4px); }
          }
        `}
      </style>

      <div style={headerStyle}>AI Assistant</div>

      <div style={messageListStyle}>
        {messages.map((msg) => (
          <div key={msg.id} style={getBubbleStyle(msg.sender)}>
            {msg.text}
          </div>
        ))}

        {isTyping && (
          <div
            style={{
              ...getBubbleStyle("opponent"),
              display: "flex",
              alignItems: "center",
              height: "40px",
            }}
          >
            <span style={{ display: "flex", gap: "4px" }}>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#888",
                  borderRadius: "50%",
                  animation: "chatWaveDot 1.2s infinite",
                }}
              ></span>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#888",
                  borderRadius: "50%",
                  animation: "chatWaveDot 1.2s infinite",
                  animationDelay: "0.2s",
                }}
              ></span>
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: "#888",
                  borderRadius: "50%",
                  animation: "chatWaveDot 1.2s infinite",
                  animationDelay: "0.4s",
                }}
              ></span>
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={inputAreaStyle}>
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="type a message..."
          style={inputStyle}
          rows={1}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={sendButtonStyle}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatArea;
