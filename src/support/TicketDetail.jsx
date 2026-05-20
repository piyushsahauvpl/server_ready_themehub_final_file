import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft, FiAlertCircle, FiClock, FiUser, FiTag, FiMessageCircle } from "react-icons/fi";
import TicketMessages from "../components/TicketMessages";

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

export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [ticket, setTicket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        // Get current user
        const authRes = await fetch(`${API_URL}/check-auth.php`, {
          credentials: "include",
        });
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          // Ensure user object has id field (might be id or user_id)
          const userId = authData.user.id || authData.user.user_id;
          const parsedId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
          if (isNaN(parsedId)) {
            console.error('Invalid user ID:', userId, authData.user);
          }
          const userObj = {
            ...authData.user,
            id: parsedId,
            // Ensure id is a number
            user_id: parsedId,
          };
          setCurrentUser(userObj);
          console.log('Current user set:', userObj); // Debug log
        } else {
          console.warn('User not authenticated or user data missing:', authData);
        }

        // Get ticket
        const res = await fetch(`${API_URL}/tickets.php?id=${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to load ticket");
        setTicket(data.ticket);
      } catch (err) {
        setError(err.message || "Failed to load ticket");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error || "Ticket not found"}</p>
          <button
            onClick={() => navigate("/support/tickets")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            style={{ backgroundColor: "#04733c" }}
          >
            Back to Tickets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <button
          onClick={() => {
            // Prefer explicit origin if provided. If origin is tickets list or
            // missing, navigate to the tickets list page.
            const from = location.state && location.state.from;
            if (from && from !== '/support/tickets') {
              navigate(from);
            } else {
              navigate('/support/tickets');
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium mb-6"
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
          Back to Tickets
        </button>

        {/* Ticket Info Card */}
        <div className="bg-white rounded-lg shadow-xl border-2 border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-3">
                {ticket.subject}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-gray-600 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                  #{ticket.ticket_number}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    statusColors[ticket.status] || statusColors.OPEN
                  }`}
                >
                  {ticket.status.replace("_", " ")}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                    priorityColors[ticket.priority] || priorityColors.MEDIUM
                  }`}
                >
                  {ticket.priority}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {ticket.category.replace("_", " ")}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FiUser className="w-4 h-4 text-gray-500" />
              <span>
                <strong className="text-gray-900">Created by:</strong> {ticket.creator_name || "Unknown"}
              </span>
            </div>
            {ticket.assignee_name && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiUser className="w-4 h-4 text-gray-500" />
                <span>
                  <strong className="text-gray-900">Assigned to:</strong> {ticket.assignee_name}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <FiClock className="w-4 h-4 text-gray-500" />
              <span>
                <strong className="text-gray-900">Created:</strong> {new Date(ticket.created_at).toLocaleString()}
              </span>
            </div>
            {ticket.product_name && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiTag className="w-4 h-4 text-gray-500" />
                <span>
                  <strong className="text-gray-900">Product:</strong> {ticket.product_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Component */}
        <div style={{ height: "600px" }}>
          <TicketMessages
            ticketId={id}
            currentUser={currentUser}
            ticketStatus={ticket.status}
            onRequestChat={() => {
              // Show success message or notification
              console.log("Chat requested");
            }}
          />
        </div>
      </div>
    </div>
  );
}
