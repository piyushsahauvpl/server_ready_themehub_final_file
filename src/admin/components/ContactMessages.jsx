import React, { useEffect, useState } from 'react';
import MainLayout from './MainLayout';
import { FiMail, FiTrash2, FiEye } from 'react-icons/fi';

export default function ContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchContactMessages();
  }, []);

  const fetchContactMessages = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api';
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/admin/contact-messages.php`, {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch contact messages');
      }
    } catch (err) {
      console.error('Error fetching contact messages:', err);
      setError('Failed to fetch contact messages');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'https://uptulathemehub.com/backend/api';
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`${API_URL}/admin/contact-messages.php`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(messages.filter(msg => msg.id !== id));
        if (selectedMessage?.id === id) setSelectedMessage(null);
      } else {
        alert(data.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'read') return msg.is_read === 1;
    if (filter === 'unread') return msg.is_read === 0;
    return true;
  });

  const unreadCount = messages.filter(msg => msg.is_read === 0).length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-600 mt-1">
              Total: {messages.length} messages ({unreadCount} unread)
            </p>
          </div>
          <button
            onClick={fetchContactMessages}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white p-4 rounded-lg shadow">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({messages.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'unread'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'read'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Read ({messages.filter(msg => msg.is_read === 1).length})
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="mt-2 text-gray-600">Loading messages...</p>
          </div>
        )}

        {/* Messages Table */}
        {!loading && filteredMessages.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMessages.map(msg => (
                      <tr
                        key={msg.id}
                        className={`hover:bg-gray-50 cursor-pointer transition ${
                          msg.is_read === 0 ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedMessage(msg)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {msg.is_read === 0 && (
                              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                            <span className="font-medium text-gray-900">
                              {msg.first_name} {msg.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{msg.email}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">{msg.phone}</td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMessage(msg);
                              }}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-100 rounded transition"
                              title="View"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteMessage(msg.id);
                              }}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded transition"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Message Details */}
            {selectedMessage && (
              <div className="bg-white rounded-lg shadow p-6 lg:sticky lg:top-6 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Message Details</h2>
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Name
                    </label>
                    <p className="text-gray-900">
                      {selectedMessage.first_name} {selectedMessage.last_name}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Email
                    </label>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-green-600 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Phone
                    </label>
                    <a
                      href={`tel:${selectedMessage.phone}`}
                      className="text-green-600 hover:underline"
                    >
                      {selectedMessage.phone}
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Date
                    </label>
                    <p className="text-gray-600">
                      {new Date(selectedMessage.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                      Message
                    </label>
                    <div className="bg-gray-50 p-4 rounded-lg text-gray-900 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
                      {selectedMessage.message}
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMessage(selectedMessage.id)}
                    className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                  >
                    <FiTrash2 size={18} />
                    Delete Message
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMessages.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiMail size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No messages</h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'No contact messages yet'
                : `No ${filter} messages yet`}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
