import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../components/MainLayout";
import TicketMessages from "../../components/TicketMessages";
import { FiArrowLeft, FiAlertCircle, FiClock, FiUser, FiTag, FiCheckCircle, FiXCircle, FiMessageCircle, FiPackage, FiDollarSign, FiCreditCard } from "react-icons/fi";

const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

const statusColors = {
  OPEN: "bg-blue-100 text-blue-800",
  ASSIGNED: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  WAITING_FOR_USER: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const statusOptions = ["OPEN", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"];

export default function CsTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const token = localStorage.getItem("cs_token");
        
        // Get current user
        const authRes = await fetch(`${API_URL}/cs/check-auth.php`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        const authData = await authRes.json();
        if (authData.authenticated && authData.user) {
          // Ensure user object has all required fields and id is an integer
          const userId = authData.user.id || authData.user.user_id;
          const userObj = {
            id: typeof userId === 'number' ? userId : parseInt(String(userId), 10),
            email: authData.user.email,
            role: authData.user.role,
            name: authData.user.name || authData.user.full_name,
            full_name: authData.user.full_name || authData.user.name,
            token: token, // Include token for API calls
            user_id: typeof userId === 'number' ? userId : parseInt(String(userId), 10), // Also set user_id for compatibility
          };
          // Ensure id is a valid number
          if (isNaN(userObj.id)) {
            console.error('Invalid user ID:', userId, authData.user);
          }
          setCurrentUser(userObj);
          console.log('CS Current user set:', userObj); // Debug log
        } else {
          // Fallback: get user from localStorage
          const csUserStr = localStorage.getItem("cs_user");
          if (csUserStr) {
            try {
              const csUser = JSON.parse(csUserStr);
              const userId = csUser.id || csUser.user_id;
              const parsedId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
              if (isNaN(parsedId)) {
                console.error('Invalid user ID from localStorage:', userId, csUser);
              }
              setCurrentUser({
                ...csUser,
                id: parsedId,
                user_id: parsedId,
                token: token,
              });
            } catch (e) {
              console.error("Failed to parse cs_user:", e);
            }
          }
        }

        // Get ticket
        const res = await fetch(`${API_URL}/tickets.php?id=${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("cs_token");
      console.log("📤 Attempting to update ticket status:", { id, newStatus, tokenExists: !!token });
      
      const res = await fetch(`${API_URL}/tickets.php?id=${id}&status=${newStatus}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });
      
      console.log("📥 Server response status:", res.status);
      const data = await res.json();
      console.log("📥 Server response data:", data);
      
      if (data.success) {
        setTicket((prev) => ({ ...prev, status: newStatus }));
        alert("Status updated to " + newStatus.replace("_", " "));
      } else {
        const errorMsg = data.error ? `${data.message} (${data.error})` : data.message || "Failed to update status";
        alert(errorMsg);
        console.error("❌ Status update failed:", errorMsg);
      }
    } catch (err) {
      const errorMsg = `Error: ${err.message}`;
      alert(errorMsg);
      console.error("❌ Status update error:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("cs_token");
      const res = await fetch(`${API_URL}/tickets.php?assign=1&id=${id}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        // Reload ticket
        const ticketRes = await fetch(`${API_URL}/tickets.php?id=${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "include",
        });
        const ticketData = await ticketRes.json();
        if (ticketData.success) {
          setTicket(ticketData.ticket);
        }
      } else {
        alert(data.message || "Failed to assign ticket");
      }
    } catch (err) {
      alert("Failed to assign ticket");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <p className="text-gray-500">Loading ticket...</p>
        </div>
      </MainLayout>
    );
  }

  if (error || !ticket) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error</h3>
            <p className="text-gray-600 mb-4">{error || "Ticket not found"}</p>
            <button
              onClick={() => navigate("/cs/ticket")}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              style={{ backgroundColor: "#04733c" }}
            >
              Back to Tickets
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <button
            onClick={() => navigate("/cs/ticket")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Tickets</span>
          </button>

          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                  {ticket.subject || `Ticket #${ticket.ticket_number}`}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600 font-medium">
                    #{ticket.ticket_number}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[ticket.status] || statusColors.OPEN
                    }`}
                  >
                    {ticket.status.replace("_", " ")}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${
                      ticket.priority === "URGENT" ? "bg-red-500" :
                      ticket.priority === "HIGH" ? "bg-orange-500" :
                      ticket.priority === "MEDIUM" ? "bg-yellow-500" :
                      "bg-gray-500"
                    }`}
                  >
                    {ticket.priority}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {ticket.category ? ticket.category.replace("_", " ") : "GENERAL"}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {(!ticket.assignee_name || ticket.assigned_to_id !== currentUser?.id) && ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                  <button
                    onClick={handleAssignToMe}
                    disabled={updatingStatus}
                    className="px-4 py-2 text-white rounded-lg transition-all text-sm font-semibold disabled:opacity-50 shadow-md hover:shadow-lg"
                    style={{ backgroundColor: "#04733c" }}
                    onMouseEnter={(e) => {
                      if (!updatingStatus) e.currentTarget.style.backgroundColor = "#035a2f";
                    }}
                    onMouseLeave={(e) => {
                      if (!updatingStatus) e.currentTarget.style.backgroundColor = "#04733c";
                    }}
                  >
                    {ticket.assignee_name ? "Reassign to Me" : "Assign to Me"}
                  </button>
                )}
                {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
                  <select
                    value={ticket.status}
                    onChange={(e) => {
                      if (e.target.value !== ticket.status) {
                        handleStatusUpdate(e.target.value);
                      }
                    }}
                    disabled={updatingStatus}
                    className="px-4 py-2 border-2 border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
                    style={{ focusRingColor: "#04733c" }}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiUser className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>Created by:</strong> {ticket.creator_name || ticket.creator_email || "Unknown"} 
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${
                    ticket.created_by_role === 'SELLER' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ticket.created_by_role || "USER"}
                  </span>
                </span>
              </div>
              {ticket.assignee_name ? (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiUser className="w-4 h-4 text-gray-500" />
                  <span>
                    <strong>Assigned to:</strong> {ticket.assignee_name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-orange-600">
                  <FiAlertCircle className="w-4 h-4" />
                  <span>
                    <strong>Unassigned</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiClock className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}
                </span>
              </div>
              {ticket.product_name && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiPackage className="w-4 h-4 text-gray-500" />
                  <span>
                    <strong>Product:</strong> {ticket.product_name}
                  </span>
                </div>
              )}
              {ticket.order_ref_id && (
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiDollarSign className="w-4 h-4 text-gray-500" />
                  <span>
                    <strong>Order:</strong> #{ticket.order_ref_id}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <FiMessageCircle className="w-4 h-4 text-gray-500" />
                <span>
                  <strong>Category:</strong> {ticket.category ? ticket.category.replace("_", " ") : "GENERAL"}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Component */}
          <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden" style={{ height: "650px", minHeight: "650px" }}>
            {currentUser ? (
              <TicketMessages
                ticketId={id}
                currentUser={currentUser}
                isCustomerSupport={true}
                onNewMessage={() => {
                  // Refresh ticket data if needed
                  const loadTicket = async () => {
                    try {
                      const token = localStorage.getItem("cs_token");
                      const res = await fetch(`${API_URL}/tickets.php?id=${id}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        credentials: "include",
                      });
                      const data = await res.json();
                      if (data.success) {
                        setTicket(data.ticket);
                      }
                    } catch (err) {
                      console.error("Failed to refresh ticket:", err);
                    }
                  };
                  loadTicket();
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-green-600 mb-2" style={{ borderTopColor: "#04733c" }}></div>
                  <p className="text-gray-600">Loading chat...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
