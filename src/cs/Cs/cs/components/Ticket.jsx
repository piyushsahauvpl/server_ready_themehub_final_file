import React, { useEffect, useState } from "react";
import MainLayout from "../components/MainLayout";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        "https://uptulathemehub.com/backend/api/tickets.php",
        { withCredentials: true }
      );

      if (res.data.success) {
        setTickets(res.data.tickets || []);
      } else {
        setError("Failed to load tickets");
      }
    } catch (err) {
      setError("Backend connection failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Only show non-closed tickets
  const activeTickets = tickets.filter(
    (ticket) => ticket.status !== "Closed"
  );

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h5 className="text-lg font-semibold">All Tickets</h5>

          <button
            onClick={fetchTickets}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Loading / Error */}
        {loading && <p className="text-gray-500">Loading tickets...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {/* Ticket List */}
        {!loading && activeTickets.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold text-gray-700">
              No new tickets found
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              All tickets are resolved or closed.
            </p>

            <button
              onClick={fetchTickets}
              className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        )}

        <div className="space-y-3">
          {activeTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
              onClick={() =>
                navigate("/cs/ticketdetails", { state: { ticket } })
              }
            >
              <div className="flex items-start gap-4">
                <input type="checkbox" className="mt-1" />

                <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {ticket.customer?.charAt(0) || "U"}
                </div>

                <div className="flex-1">
                  <span className="font-medium text-sm">
                    {ticket.title} #{ticket.id}
                  </span>

                  <p className="text-xs text-gray-500 mt-1">
                    {ticket.customer} · Created:{" "}
                    {new Date(ticket.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <div className="flex items-center justify-end gap-1 text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {ticket.priority}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {ticket.status}
                  </div>
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
