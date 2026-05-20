import React from 'react';

export default function Notifications({ notifications }) {
  if (!notifications || notifications.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Notifications</h2>
        <p className="text-sm text-gray-500">No notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <span className="text-xs uppercase text-gray-500">Recent</span>
      </div>
      <div className="space-y-3">
        {notifications.map((item) => (
          <div key={item.id} className="rounded-2xl border border-gray-100 p-3 bg-gray-50">
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold text-gray-800">{item.title || 'Update'}</span>
              <span className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-gray-700">{item.message}</p>
            <div className="mt-2 text-xs uppercase text-gray-500">{item.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
