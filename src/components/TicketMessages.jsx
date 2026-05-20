import React, { useEffect, useState, useRef } from "react";
import {
  FiSend,
  FiPaperclip,
  FiMessageCircle,
  FiTrash2
} from "react-icons/fi";

const API_URL =
  process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

// ✅ Helper: get the correct token based on who is logged in
function getAuthToken(isCustomerSupport) {
  if (isCustomerSupport) {
    return localStorage.getItem("cs_token");
  }
  // Regular users (USER, SELLER) use user_token
  // Fall back to auth_token (universal) if user_token not found
  return localStorage.getItem("user_token") || localStorage.getItem("auth_token");
}

export default function TicketMessages({
  ticketId,
  currentUser,
  isCustomerSupport = false,
  onNewMessage,
  ticketStatus = null
}) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatRequested, setChatRequested] = useState(false);
  const [clearing, setClearing] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const prevMessagesLenRef = useRef(0);
  const lastAutoScrollRef = useRef(0);

  const isResolvedOrClosed =
    ticketStatus === "RESOLVED" ||
    ticketStatus === "CLOSED" ||
    ticketStatus === "Resolved" ||
    ticketStatus === "Closed";

  const getRoleDisplayName = (role) => {
    if (!role) return "Unknown";
    const map = {
      USER: "Customer",
      SELLER: "Seller",
      CUSTOMER_SUPPORT: "Support Agent",
      ADMIN: "Admin",
      user: "Customer",
      seller: "Seller",
      customer_support: "Support Agent",
      admin: "Admin"
    };
    return map[role] || role;
  };

  useEffect(() => {
    setIsInitialLoad(true);
    setShouldAutoScroll(false);
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [ticketId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container || messages.length === 0) return;

    if (isInitialLoad) {
      container.scrollTop = 0;
      setIsInitialLoad(false);
      prevMessagesLenRef.current = messages.length;
      return;
    }

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 120;

    const now = Date.now();
    const justAddedMessages = messages.length > prevMessagesLenRef.current;
    const canAutoScroll = now - lastAutoScrollRef.current > 700;

    if (
      (shouldAutoScroll || (isNearBottom && justAddedMessages)) &&
      !isUserTyping &&
      !isUserInteracting &&
      canAutoScroll
    ) {
      requestAnimationFrame(() => {
        try {
          container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        } catch (e) {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
      });
      setShouldAutoScroll(false);
      lastAutoScrollRef.current = now;
    }

    prevMessagesLenRef.current = messages.length;
  }, [messages, isUserTyping, isUserInteracting]);

  const loadMessages = async () => {
    try {
      // ✅ FIX: Use role-based token
      const token = getAuthToken(isCustomerSupport);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(
        `${API_URL}/messages.php?ticket_id=${ticketId}`,
        { headers, credentials: "include" }
      );

      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        const hasChatRequest = (data.messages || []).some((m) =>
          m.message.toLowerCase().includes("chat request")
        );
        setChatRequested(hasChatRequest);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;

    if (isResolvedOrClosed && !isCustomerSupport) {
      setError("This ticket is resolved/closed.");
      return;
    }

    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("ticket_id", ticketId);
      formData.append("message", text.trim());
      if (file) formData.append("attachment", file);

      // ✅ FIX: Use role-based token so correct identity is sent to backend
      const token = getAuthToken(isCustomerSupport);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(`${API_URL}/messages.php`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setShouldAutoScroll(true);
      loadMessages();
      onNewMessage?.();
    } catch (err) {
      setError(err.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    const diff = (new Date() - d) / 60000;
    if (diff < 1) return "Just now";
    if (diff < 60) return `${Math.floor(diff)}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString();
  };

  // ✅ FIX: Robust isMine check using ?? instead of ||
  const getIsMine = (msg) => {
    const currentId = parseInt(currentUser?.id ?? currentUser?.user_id ?? 0);
    const senderId = parseInt(msg.sender_id ?? 0);
    return currentId > 0 && senderId > 0 && currentId === senderId;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading messages…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-2 rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-green-50">
        <div className="flex items-center gap-2">
          <FiMessageCircle />
          <span className="font-semibold">Messages</span>
        </div>
        {isCustomerSupport && (
          <button
            onClick={() => {}}
            className="text-sm bg-red-600 text-white px-3 py-1 rounded"
          >
            <FiTrash2 />
          </button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 ticket-scrollbar min-h-0"
        onMouseEnter={() => setIsUserInteracting(true)}
        onMouseLeave={() => setTimeout(() => setIsUserInteracting(false), 300)}
      >
        {messages.map((msg) => {
          const isMine = getIsMine(msg);
          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] p-4 rounded-lg shadow ${
                  isMine ? "bg-green-600 text-white" : "bg-white border"
                }`}
              >
                <div className="text-xs font-semibold mb-1">
                  {isMine
                    ? "You"
                    : msg.sender_name || getRoleDisplayName(msg.sender_role || msg.user_role)}
                  <span className={`ml-2 ${isMine ? "text-green-200" : "text-gray-400"}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                {msg.attachment_url && (
                  <a
                    href={msg.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-xs underline mt-1 block ${
                      isMine ? "text-green-100" : "text-blue-500"
                    }`}
                  >
                    📎 View Attachment
                  </a>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t flex gap-2 items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-green-600 transition-colors"
          title="Attach file"
        >
          <FiPaperclip />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        {file && (
          <span className="text-xs text-gray-500 truncate max-w-[100px]">
            {file.name}
          </span>
        )}
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setIsUserTyping(true);
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(
              () => setIsUserTyping(false),
              1500
            );
          }}
          disabled={isResolvedOrClosed && !isCustomerSupport}
          className="flex-1 border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder={
            isResolvedOrClosed && !isCustomerSupport
              ? "Ticket is closed"
              : "Type a message…"
          }
        />
        <button
          type="submit"
          disabled={sending || (isResolvedOrClosed && !isCustomerSupport)}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
}