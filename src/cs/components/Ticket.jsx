import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useNavigate } from "react-router-dom";
import { FiMessageCircle, FiClock, FiUser, FiAlertCircle, FiRefreshCw, FiPlusCircle, FiPackage, FiTag } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  WAITING_FOR_USER: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityColors = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

const Ticket = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTickets();

    // Listen for external ticket status changes
    window.addEventListener("ticketStatusChanged", fetchTickets);
    return () => {
      window.removeEventListener("ticketStatusChanged", fetchTickets);
    };
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("cs_token");
      // CS agents should fetch all tickets (not just their own)
      const res = await fetch(`${API_URL}/tickets.php?my=1`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      } else {
        setError(data.message || "Failed to load tickets");
      }
    } catch (err) {
      setError("Failed to load tickets");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5">
        <div className="flex items-center justify-between mb-6">
          <h5 className="text-2xl font-bold text-gray-800">All Support Tickets</h5>
          <div className="flex gap-3">
            <button
              onClick={fetchTickets}
              className="px-4 py-2 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#04733c" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#035a2f"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#04733c"}
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {loading && <p className="text-gray-500 text-center py-8">Loading tickets...</p>}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 text-red-800">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center border border-gray-200">
            <FiMessageCircle className="text-4xl text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700">No tickets found</h3>
            <p className="text-sm text-gray-500 mt-1">There are no tickets available.</p>
            <button
              onClick={fetchTickets}
              className="mt-4 px-4 py-2 text-sm text-white rounded-lg transition-colors font-semibold shadow-md hover:shadow-lg"
              style={{ backgroundColor: "#04733c" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#035a2f"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#04733c"}
            >
              Refresh
            </button>
          </div>
        )}

        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-lg transition-all cursor-pointer border-2 border-gray-200 hover:border-green-300"
              style={{ transition: "all 0.2s" }}
              onClick={() => navigate(`/cs/ticketdetails/${ticket.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#04733c";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold text-sm flex-shrink-0">
                  {ticket.creator_name?.charAt(0).toUpperCase() || "U"}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {ticket.subject || `Ticket #${ticket.ticket_number}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        statusColors[ticket.status] || statusColors.OPEN
                      }`}
                    >
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        priorityColors[ticket.priority] || priorityColors.MEDIUM
                      }`}
                      title={ticket.priority}
                    ></span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    <span className="font-medium">#{ticket.ticket_number}</span> • {ticket.creator_name} • {ticket.category.replace("_", " ")}
                    {ticket.product_name && ` • Product: ${ticket.product_name}`}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      <span>Created: {formatDate(ticket.created_at)}</span>
                    </div>
                    {ticket.assignee_name && (
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        <span>Assigned to: {ticket.assignee_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-sm flex-shrink-0">
                  <span className="text-gray-500">
                    {new Date(ticket.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Ticket;
