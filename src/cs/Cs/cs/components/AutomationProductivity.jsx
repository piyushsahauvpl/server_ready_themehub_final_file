import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import {
  FaRobot,
  FaBell,
  FaLevelUpAlt,
} from "react-icons/fa";
 
const ticketsData = [
  {
    id: "TCK-101",
    subject: "Unable to login",
    priority: "High",
    agent: "Auto-Assigned",
    sla: 60,
    timeSpent: 45,
    status: "In Progress",
  },
  {
    id: "TCK-102",
    subject: "Payment failed",
    priority: "Medium",
    agent: "John",
    sla: 120,
    timeSpent: 130,
    status: "Overdue",
  },
];
 
function AutomationProductivity() {
  const [autoAssign, setAutoAssign] = useState(true);
  const [autoReply, setAutoReply] = useState(true);
  const [escalation, setEscalation] = useState(true);
 
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <FaRobot className="text-blue-600" />
            Automation & Productivity
          </h3>
          <p className="text-gray-500">
            Automate ticket handling and improve agent productivity
          </p>
        </div>
 
        {/* Automation Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[
            {
              label: "Auto Assign Tickets",
              desc: "Automatically assign tickets to available agents",
              value: autoAssign,
              setValue: setAutoAssign,
            },
            {
              label: "Send Auto Replies",
              desc: "Automatically reply when a ticket is created",
              value: autoReply,
              setValue: setAutoReply,
            },
            {
              label: "Enable Escalation",
              desc: "Escalate ticket if SLA is breached",
              value: escalation,
              setValue: setEscalation,
            },
          ].map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{item.label}</span>
 
                {/* Toggle */}
                <button
                  onClick={() => item.setValue(!item.value)}
                  className={`w-12 h-6 rounded-full relative transition ${
                    item.value ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition ${
                      item.value ? "translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
 
        {/* SLA Table */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-6 py-4 font-semibold">
            SLA Tracking & Escalation
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left">
                  <th className="px-4 py-3">Ticket ID</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Agent</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
 
              <tbody>
                {ticketsData.map((ticket) => {
                  const percentage = Math.min(
                    (ticket.timeSpent / ticket.sla) * 100,
                    100
                  );
 
                  const barColor =
                    percentage < 70
                      ? "bg-green-500"
                      : percentage < 100
                      ? "bg-yellow-500"
                      : "bg-red-500";
 
                  return (
                    <tr
                      key={ticket.id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-medium">
                        {ticket.id}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.subject}
                      </td>
                      <td className="px-4 py-3">
                        {ticket.agent}
                      </td>
 
                      {/* Priority */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.priority === "High"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </td>
 
                      {/* SLA Progress */}
                      <td className="px-4 py-3 w-48">
                        <div className="w-full bg-gray-200 rounded-full h-4 relative">
                          <div
                            className={`${barColor} h-4 rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                            {Math.round(percentage)}%
                          </span>
                        </div>
                      </td>
 
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            ticket.status === "Overdue"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {ticket.status}
                        </span>
                      </td>
 
                      {/* Action */}
                      <td className="px-4 py-3">
                        {ticket.status === "Overdue" ? (
                          <button
                            onClick={() =>
                              alert(
                                "Ticket escalated to senior agent!"
                              )
                            }
                            className="flex items-center gap-1 border border-red-500 text-red-600 px-3 py-1 rounded hover:bg-red-50"
                          >
                            <FaLevelUpAlt />
                            Escalate
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              alert("Reminder sent to agent")
                            }
                            className="flex items-center gap-1 border border-gray-400 text-gray-600 px-3 py-1 rounded hover:bg-gray-100"
                          >
                            <FaBell />
                            Reminder
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
 
export default AutomationProductivity;
 
