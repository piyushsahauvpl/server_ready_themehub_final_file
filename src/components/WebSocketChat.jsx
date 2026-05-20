import React, { useEffect, useState, useRef } from "react";
import { FiSend, FiPaperclip, FiX } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
const WS_URL = process.env.REACT_APP_WS_URL || "wss://uptulathemehub.com:8081/tickets";

export default function WebSocketChat({ ticketId, currentUser, onNewMessage }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [ws, setWs] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Get auth token (JWT for CS, or session for users/sellers)
  const getAuthToken = async () => {
    const csToken = localStorage.getItem("cs_token");
    if (csToken) return csToken;

    // For users/sellers, we'll use session-based auth
    // The backend middleware will handle session auth
    return null;
  };

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch(`${API_URL}/messages.php?ticket_id=${ticketId}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to load messages:", err);
      }
    };
    if (ticketId) loadMessages();
  }, [ticketId]);

  // WebSocket connection
  useEffect(() => {
    if (!ticketId) return;

    let socket = null;
    let reconnectTimeout = null;

    const connect = async () => {
      try {
        const token = await getAuthToken();
        const separator = WS_URL.includes("?") ? "&" : "?";
        const wsUrl = `${WS_URL}${separator}ticket_id=${ticketId}${token ? `&token=${token}` : ""}`;
        
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("WebSocket connected");
          setConnected(true);
          setError("");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message:new") {
              setMessages((prev) => [...prev, data.message]);
              if (onNewMessage) onNewMessage(data.message);
            } else if (data.type === "message:read") {
              // Update read status if needed
            }
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
          }
        };

        socket.onerror = (err) => {
          console.error("WebSocket error:", err);
          setError("Connection error. Using REST API fallback.");
          setConnected(false);
        };

        socket.onclose = () => {
          console.log("WebSocket disconnected");
          setConnected(false);
          // Attempt to reconnect after 3 seconds
          reconnectTimeout = setTimeout(connect, 3000);
        };

        setWs(socket);
      } catch (err) {
        console.error("Failed to connect WebSocket:", err);
        setError("WebSocket unavailable. Using REST API.");
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket) socket.close();
    };
  }, [ticketId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("ticket_id", ticketId);
      formData.append("message", text.trim());
      if (file) {
        formData.append("attachment", file);
      }

      const res = await fetch(`${API_URL}/messages.php`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to send message");
      }

      // Add message to local state
      const newMsg = data.data;
      setMessages((prev) => [...prev, newMsg]);
      if (onNewMessage) onNewMessage(newMsg);

      // Send via WebSocket if connected
      if (ws && connected) {
        ws.send(
          JSON.stringify({
            type: "message:new",
            ticket_id: ticketId,
            message: newMsg,
          })
        );
      }

      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}></div>
          <span className="text-sm font-medium text-gray-700">
            {connected ? "Live Chat" : "Chat (REST Mode)"}
          </span>
        </div>
        {error && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
            {error}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: "400px" }}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = currentUser && (
              msg.sender_id === currentUser.id ||
              (msg.sender_role === "CUSTOMER_SUPPORT" && currentUser.role === "CUSTOMER_SUPPORT")
            );

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    isCurrentUser
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  style={isCurrentUser ? { backgroundColor: "#04733c" } : {}}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">{msg.sender_name || msg.sender_role}</span>
                    <span className={`text-xs ${isCurrentUser ? "text-green-100" : "text-gray-500"}`}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  {msg.attachment_url && (
                    <a
                      href={
                        msg.attachment_url.startsWith("http")
                          ? msg.attachment_url
                          : `https://uptulathemehub.com${msg.attachment_url}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs underline"
                    >
                      <FiPaperclip className="w-3 h-3" />
                      Attachment
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-gray-50">
        {file && (
          <div className="mb-2 flex items-center gap-2 bg-white p-2 rounded border border-gray-200">
            <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <FiPaperclip className="w-5 h-5 text-gray-600" />
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            placeholder="Type your message..."
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || (!text.trim() && !file)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ backgroundColor: "#04733c" }}
          >
            <FiSend className="w-4 h-4" />
            {sending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
