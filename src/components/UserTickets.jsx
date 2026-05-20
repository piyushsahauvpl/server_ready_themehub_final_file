import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiMessageCircle, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiEye, FiUser } from "react-icons/fi";

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

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/tickets.php?my=1`, {
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Support Tickets</h2>
        <button
          onClick={() => navigate("/support/tickets/new")}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg flex items-center gap-2"
          style={{ backgroundColor: "#04733c" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#035a2f";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#04733c";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <FiMessageCircle className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 text-red-800">
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg border-2 border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4" style={{ backgroundColor: "#f0fdf4" }}>
            <FiMessageCircle className="w-8 h-8" style={{ color: "#04733c" }} />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No tickets yet</h3>
          <p className="text-gray-500 mb-4">Create a ticket to get support for your issues</p>
          <button
            onClick={() => navigate("/support/tickets/new")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-md hover:shadow-lg"
            style={{ backgroundColor: "#04733c" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#035a2f";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#04733c";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Create Ticket
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-lg border-2 border-gray-200 p-5 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer"
              onClick={() => navigate(`/support/tickets/${ticket.id}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#04733c";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-base font-bold text-gray-800">
                      {ticket.subject}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${
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
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-semibold text-gray-800">#{ticket.ticket_number}</span> • {ticket.category.replace("_", " ")}
                    {ticket.product_name && ` • Product: ${ticket.product_name}`}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                    {ticket.assignee_name && (
                      <div className="flex items-center gap-1">
                        <FiUser className="w-3 h-3" />
                        <span>Assigned to {ticket.assignee_name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/support/tickets/${ticket.id}`);
                  }}
                  className="ml-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg text-sm"
                  style={{ backgroundColor: "#04733c" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#035a2f";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#04733c";
                  }}
                >
                  <FiEye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
