import React, { useState, useEffect } from "react";

export default function VisitorMeterAndChatbot() {
  const [visitorCount, setVisitorCount] = useState(1);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { type: "bot", text: "Hi there! Ask anything about our templates." }
  ]);

  // Update visitor count periodically
  useEffect(() => {
    const updateCount = () => {
      setVisitorCount(Math.max(1, Math.floor((Date.now() / 1000) % 97) + Math.floor(Math.random() * 20)));
    };
    updateCount();
    const interval = setInterval(updateCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMsg = { type: "user", text: chatMessage };
    setChatMessages(prev => [...prev, userMsg]);
    setChatMessage("");

    // Simulate bot response
    setTimeout(() => {
      const responses = [
        "Thanks for your question! Our support team will get back to you soon.",
        "I can help you find the perfect template. What are you looking for?",
        "Great question! You can browse our templates by category or use the search feature.",
        "For more detailed help, please create a support ticket from your account dashboard.",
      ];
      const botMsg = {
        type: "bot",
        text: responses[Math.floor(Math.random() * responses.length)]
      };
      setChatMessages(prev => [...prev, botMsg]);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="home-widgets-end">
      <div className="visitor-meter-widget-end">
        <div className="vm-label">Visitors Online</div>
        <div className="vm-count">{visitorCount}</div>
      </div>

      <div className="chatbot-widget-end">
        <details 
          className="chatbot-panel" 
          open={chatOpen}
          onToggle={(e) => setChatOpen(e.target.open)}
        >
          <summary className="chatbot-toggle">Chat with us</summary>
          <div className="chatbot-body">
            <div className="chatbot-messages">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`chatbot-msg ${msg.type === "user" ? "chatbot-msg-user" : "chatbot-msg-bot"}`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            <div className="chatbot-input-group">
              <input
                type="text"
                className="chatbot-input"
                placeholder="Type your question…"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button
                className="chatbot-send"
                type="button"
                onClick={handleSendMessage}
              >
                Send
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}
