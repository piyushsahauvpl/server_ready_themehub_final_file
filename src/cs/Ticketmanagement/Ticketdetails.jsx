import React from "react";
import MainLayout from "../components/MainLayout";
import { useLocation } from "react-router-dom";
import {
  FaUserPlus,
  FaArchive,
  FaBan,
  FaTasks,
  FaPaperclip,
  FaEllipsisV,
} from "react-icons/fa";
 
const ModernTicketDetails = () => {
  const location = useLocation();
  const initialTicket = location.state?.ticket;
  const [ticket, setTicket] = React.useState(initialTicket || null);
  const [loading, setLoading] = React.useState(!initialTicket);
  const [error, setError] = React.useState("");
  const [messages, setMessages] = React.useState([]);
  const [chatInput, setChatInput] = React.useState("");
  const [sending, setSending] = React.useState(false);

  React.useEffect(() => {
    if (!initialTicket || !initialTicket.id) return;

    const id = initialTicket.id;
    setLoading(true);

    // Load ticket core details
    fetch(`https://uptulathemehub.com/backend/api/tickets.php?id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.ticket) {
          setTicket(data.ticket);
        } else {
          setError("Failed to load ticket details");
        }
      })
      .catch(() => setError("Backend error"))
      .finally(() => setLoading(false));

    // Load chat messages
    fetch(`https://uptulathemehub.com/backend/api/messages.php?ticket_id=${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      })
      .catch(() => {});
  }, [initialTicket]);

  const handleSendMessage = async () => {
    if (!ticket || !ticket.id || !chatInput.trim()) return;
    setSending(true);
    try {
      const res = await fetch(
        "https://uptulathemehub.com/backend/api/messages.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticket_id: ticket.id,
            sender_type: "agent",
            message: chatInput.trim(),
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
        setChatInput("");
      } else {
        alert(data.message || "Failed to send message");
      }
    } catch (e) {
      alert("Network error while sending message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
          <p className="text-gray-500">Loading ticket details...</p>
        </div>
      </MainLayout>
    );
  }
  if (!ticket) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
          <p className="text-gray-500">No ticket selected.</p>
        </div>
      </MainLayout>
    );
  }
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-4">
            {/* Action Bar */}
            {/* <div className="bg-white rounded-xl shadow p-3 flex gap-2 flex-wrap">
              {[
                { icon: <FaUserPlus />, label: "Assign" },
                { icon: <FaArchive />, label: "Archive" },
                { icon: <FaBan />, label: "Spam" },
                { icon: <FaTasks />, label: "Add task" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  className="flex items-center gap-2 text-sm border px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
              <button className="border px-3 py-1.5 rounded-lg hover:bg-gray-50">
                <FaEllipsisV />
              </button>
            </div> */}
 
            {/* Ticket Header */}
            <div className="bg-white rounded-xl shadow p-4">
              <h4 className="text-lg font-semibold">
                {ticket.subject}{" "}
                <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                  ID #{ticket.id}
                </span>
              </h4>
              <p className="text-sm text-gray-500 mt-1">
                Opened by {ticket.customer} · {new Date(ticket.created_at).toLocaleString()}
              </p>
            </div>
 
            {/* Original ticket message */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {ticket.customer?.charAt(0) || "U"}
                </div>
                <div>
                  <h6 className="font-semibold mb-0">
                    {ticket.customer}
                  </h6>
                  <p className="text-sm text-gray-500">
                    {ticket.email || "user@example.com"}
                  </p>
                </div>
                <span className="ml-auto text-xs text-gray-400">
                  {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>
 
              <div className="text-sm text-gray-700 space-y-3">
                <p>{ticket.description}</p>
              </div>

              {/* Attachments */}
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="flex gap-3 mt-4">
                  {ticket.attachments.map((attachment, index) => {
                    // Always use backend URL for file access
                    const backendUrl = `https://uptulathemehub.com/backend/uploads/tickets/${attachment.name}`;
                    return (
                      <div key={index} className="border rounded-lg px-3 py-2 text-sm">
                        📄
                        <a
                          href={backendUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          {attachment.name}
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
 
            {/* Conversation thread */}
            <div className="bg-white rounded-xl shadow p-4 space-y-4">
              <h5 className="text-sm font-semibold text-gray-800 mb-2">
                Conversation
              </h5>

              <div className="max-h-80 overflow-y-auto space-y-3 border border-gray-100 rounded-lg p-3 bg-gray-50">
                {messages.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No messages yet. Your reply will appear here.
                  </p>
                )}
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender_type === "agent"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-xs ${
                        m.sender_type === "agent"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-gray-200 text-gray-800 rounded-bl-sm"
                      }`}
                    >
                      <div>{m.message}</div>
                      <div className="mt-1 text-[10px] opacity-70 text-right">
                        {m.created_at
                          ? new Date(m.created_at).toLocaleString()
                          : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <div className="border-t border-gray-200 pt-3 mt-2">
                <textarea
                  rows={3}
                  placeholder="Reply to customer..."
                  className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />

                <div className="flex justify-between items-center mt-3">
                  <FaPaperclip className="text-gray-400 cursor-not-allowed" />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={sending || !chatInput.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded-lg"
                  >
                    {sending ? "Sending..." : "Send reply"}
                  </button>
                </div>
              </div>
            </div>
          </div>
 
          {/* SIDEBAR */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow p-4 sticky top-6">
              <h6 className="font-semibold mb-3">
                Ticket details
              </h6>
 
              <div className="flex justify-between text-sm mb-2">
                <span>Status</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  ticket.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {ticket.status}
                </span>
              </div>
 

 
              <hr className="my-4" />
 
              <h6 className="font-semibold mb-3">
                Update Status
              </h6>
              <div className="mb-3">
                <label className="block text-sm mb-1">Status</label>
                <select
                  className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500"
                  value={ticket.status}
                  onChange={e => setTicket({ ...ticket, status: e.target.value })}
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm"
                onClick={async () => {
                  // Update status in backend
                  const res = await fetch(`https://uptulathemehub.com/backend/api/tickets.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: ticket.id, status: ticket.status })
                  });
                  const data = await res.json();
                  if (data.success && data.ticket) {
                    setTicket(data.ticket); // Use backend-confirmed ticket
                    // Notify ticket list to refresh
                    window.dispatchEvent(new Event('ticketStatusChanged'));
                    alert('Status updated!');
                  } else {
                    alert('Failed to update status');
                  }
                }}
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
 
export default ModernTicketDetails;
 
 
 
