// import MainLayout from "../components/MainLayout";
// import { FiTrash2, FiUserX } from "react-icons/fi";
// import { useState } from "react";

// const dummyUsers = [
//   {
//     id: 1,
//     name: "Rahul Sharma",
//     email: "rahul@example.com",
//     role: "Admin",
//     department: "Management",
//     status: "Active",
//   },
//   {
//     id: 2,
//     name: "Priya Singh",
//     email: "priya@example.com",
//     role: "Customer",
//     department: "Support",
//     status: "Blocked",
//   },
//   {
//     id: 3,
//     name: "Aman Verma",
//     email: "aman@example.com",
//     role: "Manager",
//     department: "Sales",
//     status: "Active",
//   },
// ];

// const statusColors = {
//   Active: "bg-green-100 text-green-700",
//   Blocked: "bg-red-100 text-red-700",
// };

// export default function UserList() {
//   const [users, setUsers] = useState(dummyUsers);
//   const [search, setSearch] = useState("");
//   const [roleFilter, setRoleFilter] = useState("");

//   const filteredUsers = users.filter(
//     (u) =>
//       u.name.toLowerCase().includes(search.toLowerCase()) &&
//       (roleFilter === "" || u.role === roleFilter)
//   );

//   const toggleStatus = (id) => {
//     setUsers((prev) =>
//       prev.map((u) =>
//         u.id === id
//           ? { ...u, status: u.status === "Active" ? "Blocked" : "Active" }
//           : u
//       )
//     );
//   };

//   const deleteUser = (id) => {
//     setUsers((prev) => prev.filter((u) => u.id !== id));
//   };

//   return (
//     <MainLayout>
//       {/* Breadcrumb */}
//       {/* <div className="text-gray-500 text-sm mb-3">
//         Home / Users / <span className="font-medium text-gray-800">User List</span>
//       </div> */}

//       <h2 className="text-2xl font-bold text-gray-800 mb-6">User List</h2>

//       {/* Search + Filters */}
//       <div className="flex justify-between mb-4">
//         <input
//           type="text"
//           placeholder="Search user..."
//           className="border p-2 rounded-lg w-60 focus:ring-2 focus:ring-green-500"
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//         />

//         <select
//           className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
//           onChange={(e) => setRoleFilter(e.target.value)}
//         >
//           <option value="">All Roles</option>
//           <option>Admin</option>
//           <option>Manager</option>
//           <option>Support</option>
//           <option>Customer</option>
//         </select>
//       </div>

//       {/* User Table */}
//       <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
//         <table className="w-full table-auto text-left text-gray-700">
//           <thead className="bg-gray-100 font-semibold text-gray-800">
//             <tr>
//               <th className="p-3">Username</th>
//               <th className="p-3">Email</th>
//               <th className="p-3">Role</th>
//               <th className="p-3">Department</th>
//               <th className="p-3">Status</th>
//               <th className="p-3 text-center">Actions</th>
//             </tr>
//           </thead>

//           <tbody>
//             {filteredUsers.map((user) => (
//               <tr key={user.id} className="border-b hover:bg-gray-50 transition">
//                 <td className="p-3 font-medium">{user.name}</td>
//                 <td className="p-3">{user.email}</td>
//                 <td className="p-3">{user.role}</td>
//                 <td className="p-3">{user.department}</td>

//                 <td className="p-3">
//                   <span
//                     className={`px-3 py-1 rounded-lg text-sm ${statusColors[user.status]}`}
//                   >
//                     {user.status}
//                   </span>
//                 </td>

//                 <td className="p-3 text-center flex justify-center gap-6">
//                   {/* Toggle Status */}
//                   <FiUserX
//                     className="text-yellow-600 cursor-pointer hover:scale-110 transition"
//                     onClick={() => toggleStatus(user.id)}
//                     title="Block / Unblock User"
//                   />

//                   {/* Delete */}
//                   <FiTrash2
//                     className="text-red-600 cursor-pointer hover:scale-110 transition"
//                     onClick={() => deleteUser(user.id)}
//                     title="Delete User"
//                   />
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>

//         {filteredUsers.length === 0 && (
//           <p className="text-center text-gray-400 py-4">No users found</p>
//         )}
//       </div>
//     </MainLayout>
//   );
// }


import MainLayout from "../components/MainLayout";
import { FiTrash2, FiUserX } from "react-icons/fi";
import { useState, useEffect } from "react";

const statusColors = {
  Active: "bg-green-100 text-green-700",
  Blocked: "bg-red-100 text-red-700",
};

export default function UserList() {
  const API_URL = `${process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api"}/cs`;

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

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/users.php`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || `Server error ${res.status}`);
        setUsers([]);
      } else {
        // Accept either { users: [...] } or raw array
        setUsers(Array.isArray(data) ? data : data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
      setError('Network error while fetching users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load once on mount
  useEffect(() => {
    fetchUsers();
    // Optional: poll every 30 seconds for live updates
    // const id = setInterval(fetchUsers, 30000);
    // return () => clearInterval(id);
  }, []);

  const toggleStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Blocked" : "Active" }
          : u
      )
    );
  };

  const deleteUser = (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <MainLayout>
      {/* Breadcrumb */}
    

      <h2 className="text-2xl font-bold text-gray-800 mb-6">User List</h2>

      {/* Search + Filters */}
      <div className="flex justify-between mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search user..."
            className="border p-2 rounded-lg w-60 focus:ring-2 focus:ring-green-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="border p-2 rounded-lg focus:ring-2 focus:ring-green-500"
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option>Admin</option>
            <option>Manager</option>
            <option>Support</option>
            <option>Customer</option>
          </select>

          <button
            onClick={fetchUsers}
            className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading users...</div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : (
          <div className="text-sm text-gray-500">{users.length} users</div>
        )}
      </div>

      {/* User Table */}
      <div className="bg-white shadow-md rounded-xl p-4 overflow-x-auto">
        <table className="w-full table-auto text-left text-gray-700">
          <thead className="bg-gray-100 font-semibold text-gray-800">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Department</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b hover:bg-gray-50 transition">
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role || 'User'}</td>
                <td className="p-3">{user.department}</td>

                <td className="p-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-sm ${statusColors[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>

                <td className="p-3 text-center flex justify-center gap-6">
                  {/* Toggle Status */}
                  <FiUserX
                    className="text-yellow-600 cursor-pointer hover:scale-110 transition"
                    onClick={() => toggleStatus(user.id)}
                    title="Block / Unblock User"
                  />

                  {/* Delete */}
                  <FiTrash2
                    className="text-red-600 cursor-pointer hover:scale-110 transition"
                    onClick={() => deleteUser(user.id)}
                    title="Delete User"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-400 py-4">No users found</p>
        )}
      </div>
    </MainLayout>
  );
}
