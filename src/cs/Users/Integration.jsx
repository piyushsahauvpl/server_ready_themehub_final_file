import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
 
const Integrations = () => {
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(false);
  const [crmEnabled, setCrmEnabled] = useState(false);
  const [paymentEnabled, setPaymentEnabled] = useState(true);
 
  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-6">
        <h3 className="text-2xl font-bold mb-6">🔗 Integrations</h3>
 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* EMAIL INTEGRATION */}
          <div className="bg-white rounded-xl shadow p-6">
            <h5 className="text-lg font-semibold mb-1">Email Integration</h5>
            <p className="text-gray-500 text-sm mb-4">
              Connect Gmail or custom SMTP to send & receive tickets via email.
            </p>
 
            <label className="flex items-center justify-between mb-4">
              <span className="font-medium">Enable Email Integration</span>
              <input
                type="checkbox"
                checked={emailEnabled}
                onChange={() => setEmailEnabled(!emailEnabled)}
                className="toggle toggle-primary"
              />
            </label>
 
            <div className="space-y-3">
              <input
                type="email"
                placeholder="support@company.com"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
              <input
                placeholder="smtp.gmail.com"
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
              />
            </div>
 
            <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Save Settings
            </button>
          </div>
 
          {/* CHAT WIDGET */}
          <div className="bg-white rounded-xl shadow p-6">
            <h5 className="text-lg font-semibold mb-1">Chat Widget</h5>
            <p className="text-gray-500 text-sm mb-4">
              Enable live chat widget on your website.
            </p>
 
            <label className="flex items-center justify-between">
              <span className="font-medium">Enable Live Chat</span>
              <input
                type="checkbox"
                checked={chatEnabled}
                onChange={() => setChatEnabled(!chatEnabled)}
                className="toggle toggle-primary"
              />
            </label>
 
            <div className="mt-4">
              Status:{" "}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  chatEnabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {chatEnabled ? "Active" : "Disabled"}
              </span>
            </div>
 
            <button className="mt-4 border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg">
              Get Embed Script
            </button>
          </div>
 
          {/* CRM INTEGRATION */}
          <div className="bg-white rounded-xl shadow p-6">
            <h5 className="text-lg font-semibold mb-1">CRM Integration</h5>
            <p className="text-gray-500 text-sm mb-4">
              Sync customers and tickets with CRM tools.
            </p>
 
            <label className="flex items-center justify-between mb-4">
              <span className="font-medium">Enable CRM Integration</span>
              <input
                type="checkbox"
                checked={crmEnabled}
                onChange={() => setCrmEnabled(!crmEnabled)}
                className="toggle toggle-primary"
              />
            </label>
 
            <select className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500">
              <option>Select CRM</option>
              <option>HubSpot</option>
              <option>Salesforce</option>
              <option>Zoho CRM</option>
            </select>
 
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Connect CRM
            </button>
          </div>
 
          {/* PAYMENT SYSTEM */}
          <div className="bg-white rounded-xl shadow p-6">
            <h5 className="text-lg font-semibold mb-1">
              Payment / Order System
            </h5>
            <p className="text-gray-500 text-sm mb-4">
              Link orders and payments with tickets.
            </p>
 
            <label className="flex items-center justify-between mb-4">
              <span className="font-medium">Enable Payment Integration</span>
              <input
                type="checkbox"
                checked={paymentEnabled}
                onChange={() => setPaymentEnabled(!paymentEnabled)}
                className="toggle toggle-primary"
              />
            </label>
 
            <select className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500">
              <option>Select Provider</option>
              <option>Razorpay</option>
              <option>Stripe</option>
              <option>PayPal</option>
            </select>
 
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Connect Payment System
            </button>
          </div>
        </div>
 
        {/* NOTIFICATIONS */}
        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h5 className="text-lg font-semibold mb-1">
            Notification Systems
          </h5>
          <p className="text-gray-500 text-sm mb-4">
            Configure how users receive notifications.
          </p>
 
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Email Notifications
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" />
              SMS Notifications
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked />
              Push Notifications
            </label>
          </div>
 
          <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Save Notification Settings
          </button>
        </div>
      </div>
    </MainLayout>
  );
};
 
export default Integrations;
 
