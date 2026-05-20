import MainLayout from "../components/MainLayout";
import { FiTrash2, FiUserX } from "react-icons/fi";
import { useState, useEffect } from "react";

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Blocked: "bg-red-100 text-red-700",
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filteredUsers = users.filter(
    (u) => {
      const matchesName = (u.name || '').toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "" || (u.role || '').toLowerCase() === roleFilter.toLowerCase();
      return matchesName && matchesRole;
    }
  );

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";
  const ADMIN_API_URL = `${API_URL}/admin`;

  // Fetch users from API
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${ADMIN_API_URL}/users.php`);
      if (search) url.searchParams.append('search', search);
      if (roleFilter) url.searchParams.append('role', roleFilter);
      
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      
      if (data.success && data.users) {
        setUsers(data.users.map(u => ({
          ...u,
          name: u.full_name,
          status: u.status === 'active' ? 'Active' : 'Blocked'
        })));
      } else {
        setError(data.message || 'Failed to load users');
      }
    } catch (err) {
      console.error('Users fetch error', err);
      setError('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Also fetch when navigating back (using a refresh trigger)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible (user navigated back)
        fetchUsers();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const toggleStatus = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    const newStatus = user.status === "Active" ? "blocked" : "active";
    
    try {
      const res = await fetch(`${ADMIN_API_URL}/users.php`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: newStatus })
      });
      
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? { ...u, status: newStatus === "active" ? "Active" : "Blocked" }
              : u
          )
        );
      } else {
        alert('Error: ' + (data.message || 'Failed to update status'));
      }
    } catch (err) {
      console.error('Toggle status error', err);
      alert('Error updating user status');
    }
  };

  const deleteUser = async (id) => {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const userType = user.role === 'support' ? 'Customer Support' : 
                     user.role === 'admin' ? 'Admin' : 
                     user.role === 'manager' ? 'Manager' : 'User';
    
    const confirmMessage = `Are you sure you want to delete this ${userType.toLowerCase()}?\n\nName: ${user.name}\nEmail: ${user.email}\n\nThis action cannot be undone!`;
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      const res = await fetch(`${ADMIN_API_URL}/users.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id })
      });
      
      const text = await res.text();
      let data;
      try {
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        console.error('Delete user raw response:', text);
        throw new Error('Invalid response from server: ' + parseErr.message);
      }

      if (data.success) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        alert(`${userType} deleted successfully!`);
      } else {
        alert('Error: ' + (data.message || 'Failed to delete user'));
      }
    } catch (err) {
      console.error('Delete user error', err);
      alert('Error deleting user: ' + (err.message || 'Please check server logs'));
    }
  };

  return (
    <MainLayout>
      {/* Breadcrumb */}
    

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">User List</h2>
          <p className="text-gray-500 mt-1">Manage system users</p>
        </div>
        <button
          onClick={() => (window.location.href = "/admin/add-user")}
          className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add User
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          <select
            className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition bg-white"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="support">Customer Support</option>
            <option value="customer">Customer</option>
          </select>

          <button
            onClick={fetchUsers}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
          >
            Refresh
          </button>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          {loading ? (
            <div className="text-sm text-gray-500">Loading users...</div>
          ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
          ) : (
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredUsers.length}</span> of <span className="font-medium">{users.length}</span> users
            </div>
          )}
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-left text-gray-700">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Username</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Department</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-xs font-semibold text-gray-700 uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                      </svg>
                      <p className="text-lg font-medium">No users found</p>
                      <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {(user.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.department || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[user.status]}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => toggleStatus(user.id)}
                          className="p-2 hover:bg-yellow-50 rounded-lg transition"
                          title={user.status === 'Active' ? 'Block User' : 'Unblock User'}
                        >
                          <FiUserX className="text-yellow-600" size={18} />
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition"
                          title="Delete User"
                        >
                          <FiTrash2 className="text-red-600" size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}
