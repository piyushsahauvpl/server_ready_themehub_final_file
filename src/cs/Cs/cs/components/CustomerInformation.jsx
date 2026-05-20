import React, { useState } from "react";
import MainLayout from "./MainLayout";
import { FaUser, FaEnvelope, FaPhone, FaPlus } from "react-icons/fa";
 
const previousTickets = [
  { id: 201, subject: "Payment issue", status: "Closed" },
  { id: 245, subject: "Login problem", status: "Open" },
  { id: 278, subject: "Subscription upgrade", status: "Closed" },
];
 
function CustomerInformation() {
  const [tags, setTags] = useState(["VIP", "Repeat Issue"]);
  const [newTag, setNewTag] = useState("");
 
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };
 
  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };
 
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT SIDE */}
          <div className="lg:col-span-4 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-5 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl">
                <FaUser />
              </div>
 
              <h5 className="mt-3 font-semibold">Mitchel Marsh</h5>
              <p className="text-sm text-gray-500">Premium Customer</p>
 
              {/* Tags */}
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    onClick={() => removeTag(tag)}
                    className="cursor-pointer text-xs bg-gray-200 px-2 py-1 rounded-full hover:bg-red-100 hover:text-red-600"
                  >
                    {tag} ✕
                  </span>
                ))}
              </div>
 
              {/* Add Tag */}
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="text"
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                >
                  <FaPlus />
                </button>
              </div>
            </div>
 
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h6 className="font-semibold mb-3">
                Contact Information
              </h6>
 
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <FaEnvelope className="text-blue-600" />
                  <span>mitchel22@gmail.com</span>
                </div>
 
                <div className="flex items-center gap-2">
                  <FaPhone className="text-green-600" />
                  <span>+1 234 567 890</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* RIGHT SIDE */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h6 className="font-semibold mb-4">
                Previous Tickets
              </h6>
 
              <div className="divide-y">
                {previousTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex justify-between items-center py-3"
                  >
                    <div className="text-sm">
                      #{ticket.id} — {ticket.subject}
                    </div>
 
                    <span
                      className={`text-xs px-3 py-1 rounded-full ${
                        ticket.status === "Open"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
 
export default CustomerInformation;
