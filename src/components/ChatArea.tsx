import React, { useState, useRef, useEffect } from "react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "opponent";
}

const ChatArea: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to the bottom whenever messages change or typing starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    // 1. Add user message
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: "user",
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }

    // 2. Trigger typing animation
    setIsTyping(true);

    // 3. Respond after 3 seconds
    setTimeout(() => {
      setIsTyping(false);
      const opponentMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "sorry I am not available",
        sender: "opponent",
      };
      setMessages((prev) => [...prev, opponentMsg]);
    }, 3000);
  };

  // Handle 'Enter' to send, 'Shift+Enter' for new line
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

      // Show scrollbar only if the content pushes past our 120px limit
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
