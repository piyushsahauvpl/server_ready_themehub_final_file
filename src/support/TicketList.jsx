import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiMessageCircle, FiClock, FiAlertCircle, FiPlus, FiEye, FiUser, FiArrowLeft } from "react-icons/fi";
import { listMyTickets } from "./api";

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800 border-blue-200",
  ASSIGNED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-200",
  WAITING_FOR_USER: "bg-orange-100 text-orange-800 border-orange-200",
  RESOLVED: "bg-green-100 text-green-800 border-green-200",
  CLOSED: "bg-gray-100 text-gray-800 border-gray-200",
};

const priorityColors = {
  LOW: "bg-gray-500",
  MEDIUM: "bg-yellow-500",
  HIGH: "bg-orange-500",
  URGENT: "bg-red-500",
};

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const res = await listMyTickets();
        if (!res.success) throw new Error(res.message || "Failed to load tickets");
        setTickets(res.tickets || []);
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                // Redirect to home page when back is clicked
                navigate('/');
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium"
              style={{ 
                backgroundColor: '#f0fdf4',
                color: '#04733c',
                border: '1px solid #04733c'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#04733c';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.color = '#04733c';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Support Tickets</h1>
              <p className="text-gray-600">Manage and track your support requests</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/support/tickets/new")}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center gap-2"
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
            <FiPlus className="w-5 h-5" />
            Create New Ticket
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600 mb-4" style={{ borderTopColor: "#04733c" }}></div>
            <p className="text-gray-600">Loading tickets...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <FiAlertCircle className="w-5 h-5" />
              <span className="font-semibold">{error}</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4" style={{ backgroundColor: "#f0fdf4" }}>
              <FiMessageCircle className="w-10 h-10" style={{ color: "#04733c" }} />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No tickets yet</h3>
            <p className="text-gray-600 mb-6">Create your first support ticket to get help</p>
            <button
              onClick={() => navigate("/support/tickets/new")}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold shadow-lg hover:shadow-xl"
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
        )}

        {/* Tickets List */}
        {!loading && tickets.length > 0 && (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-lg shadow-md border-2 border-gray-200 hover:shadow-xl hover:border-green-300 transition-all cursor-pointer"
                onClick={() => navigate(`/support/tickets/${ticket.id}`, { state: { from: window.location.pathname } })}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#04733c";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900">
                          {ticket.subject || ticket.ticket_number}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                            statusColors[ticket.status] || statusColors.OPEN
                          }`}
                        >
                          {ticket.status.replace("_", " ")}
                        </span>
                        <span
                          className={`w-3 h-3 rounded-full ${
                            priorityColors[ticket.priority] || priorityColors.MEDIUM
                          }`}
                          title={ticket.priority}
                        ></span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-semibold text-gray-800">#{ticket.ticket_number}</span> • {ticket.category.replace("_", " ")}
                        {ticket.product_name && ` • Product: ${ticket.product_name}`}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-4 h-4" />
                          <span>{formatDate(ticket.created_at)}</span>
                        </div>
                        {ticket.assignee_name && (
                          <div className="flex items-center gap-1">
                            <FiUser className="w-4 h-4" />
                            <span>Assigned to {ticket.assignee_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/support/tickets/${ticket.id}`, { state: { from: window.location.pathname } });
                      }}
                      className="ml-4 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2 font-semibold shadow-md hover:shadow-lg"
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
