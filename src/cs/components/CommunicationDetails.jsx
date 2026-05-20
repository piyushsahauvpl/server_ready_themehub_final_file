import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useLocation } from "react-router-dom";

const CommunicationDetails = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const chatId = params.get("id") || "General";
  // Only 1:1 chat, no group
  const chatInfo = {
    101: { name: "General Support" },
    102: { name: "Payment Issues" },
    103: { name: "Template Help" },
  };
  const info = chatInfo[chatId] || { name: "General" };
  const [messages, setMessages] = useState([
    { id: 1, sender: "Customer", text: "Hi, I have a question about my order." },
  ]);
  const [input, setInput] = useState("");
  const [reply, setReply] = useState("");
  const templates = [
    "Hello, we are checking this issue for you.",
    "Thanks for reaching out. We will update you shortly.",
    "Your issue has been resolved. Please confirm.",
  ];

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { id: messages.length + 1, sender: "You", text: input }]);
    setInput("");
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5 flex flex-col items-center">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-sm p-6">
          {/* Chat Info Header */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
            <h5 className="font-semibold">
              Live Chat <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded-full">ID #{chatId}</span>
            </h5>
            <p className="text-sm text-gray-500">Chat Name: {info.name}</p>
          </div>
          {/* Chat Section (Support & Customer) */}
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 mb-4">
            <div className="h-64 overflow-y-auto border rounded-lg p-3 mb-4 bg-gray-50 flex flex-col">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-2 flex ${msg.sender === "You" || msg.sender === "Support" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg shadow ${msg.sender === "You" ? "bg-blue-600 text-white" : msg.sender === "Support" ? "bg-gray-200 text-gray-800" : "bg-green-100 text-green-900"}`}>
                    <span className="font-semibold mr-2">{msg.sender === "You" ? "Support:" : "Customer:"}</span>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <div className="flex w-full gap-2">
                <select
                  className="text-sm border rounded-lg px-2 py-2 w-1/3 min-w-[120px] focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setReply(e.target.value)}
                  value={reply}
                >
                  <option value="">Use template</option>
                  {templates.map((tpl, i) => (
                    <option key={i} value={tpl}>{tpl}</option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  placeholder="Type your reply here..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="flex-1 border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                  onClick={() => {
                    if (reply.trim() === "") return;
                    setMessages([...messages, { id: messages.length + 1, sender: "You", text: reply }]);
                    setReply("");
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CommunicationDetails;
