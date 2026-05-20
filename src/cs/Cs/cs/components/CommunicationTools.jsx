import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { useNavigate } from "react-router-dom";
import {
  FaPaperclip,
  FaComments,
  FaCompressAlt,
  FaExpandAlt,
} from "react-icons/fa";
 
const templates = [
  "Hello, we are checking this issue for you.",
  "Thanks for reaching out. We will update you shortly.",
  "Your issue has been resolved. Please confirm.",
];
 
const CommunicationTools = () => {
  const [reply, setReply] = useState("");
  const [showMerge, setShowMerge] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const [isLiveChatEnabled, setIsLiveChatEnabled] = useState(true);
  const navigate = useNavigate();
 
  // Example chat sessions data
  const [chatSessions] = useState([
    { id: 101, name: "General Support", users: ["Alice", "Bob"] },
    { id: 102, name: "Payment Issues", users: ["Charlie", "David"] },
    { id: 103, name: "Template Help", users: ["Eve", "Frank"] },
  ]);

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5">
        <div className="flex flex-col gap-6 max-w-4xl mx-auto">
          <h5 className="text-lg font-semibold mb-4">Live Chat Sessions</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {chatSessions.map((chat) => (
              <div
                key={chat.id}
                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`/cs/communicationdetails?id=${chat.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {chat.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm">{chat.name} #{chat.id}</span>
                    <p className="text-xs text-gray-500 mt-1">Users: {chat.users.join(", ")}</p>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/cs/communicationdetails?id=${chat.id}`);
                    }}
                  >
                    Open Live Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
 
export default CommunicationTools;
 
