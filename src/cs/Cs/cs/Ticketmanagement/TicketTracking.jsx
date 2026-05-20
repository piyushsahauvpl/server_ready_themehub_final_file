import React, { useState, useEffect } from "react";
import MainLayout from "../components/MainLayout";

const InternalTools = () => {
  const [ticketHistory, setTicketHistory] = useState([]);
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    resolved: 0,
    avgResponseTime: "0 min",
    satisfaction: "0%",
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    try {
      /* -------- METRICS -------- */
      const metricsRes = await fetch(
        "https://uptulathemehub.com/backend/api/tickets.php?action=metrics",
        { credentials: "include" }
      );
      const metricsData = await metricsRes.json();
      if (metricsData.success) setMetrics(metricsData.metrics);

      /* -------- TICKETS -------- */
      const ticketRes = await fetch(
        "https://uptulathemehub.com/backend/api/tickets.php",
        { credentials: "include" }
      );
      const ticketData = await ticketRes.json();

      if (ticketData.success && Array.isArray(ticketData.ticketHistory)) {
        setTicketHistory(ticketData.ticketHistory);
      } else {
        setTicketHistory([]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setTicketHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const statusBadge = (status) => {
    switch (status) {
      case "Open":
        return "bg-yellow-100 text-yellow-700";
      case "Closed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 text-gray-500">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Ticket Tracking</h3>
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Metric title="Total Tickets" value={metrics.totalTickets} color="text-blue-600" />
          <Metric title="Resolved" value={metrics.resolved} color="text-green-600" />
          <Metric title="Avg Response Time" value={metrics.avgResponseTime} color="text-cyan-600" />
          <Metric title="Customer Satisfaction" value={metrics.satisfaction} color="text-yellow-500" />
        </div>

        {/* ASSIGNED TASK / TICKET TABLE */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-6 py-4 font-semibold">
            Assigned Tickets
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>

              <tbody>
                {ticketHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  ticketHistory.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">#{ticket.id}</td>
                      <td className="px-4 py-3">{ticket.subject}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(ticket.date).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

/* METRIC CARD */
const Metric = ({ title, value, color }) => (
  <div className="bg-white rounded-xl shadow-sm p-4 text-center">
    <p className="text-sm text-gray-500">{title}</p>
    <h4 className={`text-2xl font-bold ${color}`}>{value}</h4>
  </div>
);

export default InternalTools;
