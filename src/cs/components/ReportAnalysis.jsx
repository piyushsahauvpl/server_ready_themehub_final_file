import React from "react";
import MainLayout from "../components/MainLayout";
 
const agentPerformance = [
  {
    name: "Rahul",
    tickets: 45,
    avgResponse: "5 min",
    avgResolution: "2 hrs",
    satisfaction: 92,
  },
  {
    name: "Anjali",
    tickets: 38,
    avgResponse: "7 min",
    avgResolution: "2.5 hrs",
    satisfaction: 88,
  },
  {
    name: "Vikas",
    tickets: 29,
    avgResponse: "10 min",
    avgResolution: "3 hrs",
    satisfaction: 80,
  },
];
 
function ReportsAnalytics() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5">
        <h3 className="text-xl font-bold mb-6">
          Reports & Analytics
        </h3>
 
        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">Total Tickets</p>
            <h4 className="text-2xl font-bold text-blue-600">
              112
            </h4>
          </div>
 
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">Resolved</p>
            <h4 className="text-2xl font-bold text-green-600">
              89
            </h4>
          </div>
 
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">
              Avg Response Time
            </p>
            <h4 className="text-2xl font-bold text-cyan-600">
              6 min
            </h4>
          </div>
 
          <div className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className="text-sm text-gray-500">
              Customer Satisfaction
            </p>
            <h4 className="text-2xl font-bold text-yellow-500">
              88%
            </h4>
          </div>
        </div>
 
        {/* AGENT PERFORMANCE TABLE */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b font-semibold">
            Agent Performance Report
          </div>
 
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left">Agent</th>
                  <th className="px-4 py-3 text-left">
                    Tickets Handled
                  </th>
                  <th className="px-4 py-3 text-left">
                    Avg Response
                  </th>
                  <th className="px-4 py-3 text-left">
                    Avg Resolution
                  </th>
                  <th className="px-4 py-3 text-left">
                    Customer Satisfaction
                  </th>
                </tr>
              </thead>
 
              <tbody className="divide-y">
                {agentPerformance.map((agent, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {agent.name}
                    </td>
                    <td className="px-4 py-3">
                      {agent.tickets}
                    </td>
                    <td className="px-4 py-3">
                      {agent.avgResponse}
                    </td>
                    <td className="px-4 py-3">
                      {agent.avgResolution}
                    </td>
                    <td className="px-4 py-3 w-56">
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-4 text-xs text-white flex items-center justify-center ${
                            agent.satisfaction > 90
                              ? "bg-green-500"
                              : agent.satisfaction > 80
                              ? "bg-cyan-500"
                              : "bg-yellow-500"
                          }`}
                          style={{
                            width: `${agent.satisfaction}%`,
                          }}
                        >
                          {agent.satisfaction}%
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
 
export default ReportsAnalytics;
 
 
