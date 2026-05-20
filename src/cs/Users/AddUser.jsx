// import MainLayout from "../components/MainLayout";
// import { useState } from "react";

// export default function AddUser() {
//   const [user, setUser] = useState({
//     username: "",
//     email: "",
//     role: "",
//     department: "",
//     password: "",
//     confirmPassword: "",
//   });

//   const handleChange = (e) => {
//     setUser({ ...user, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     alert("User Saved! (Frontend only now)");
//     console.log(user);
//   };

//   // Reusable Input Component with Updated Green Theme & Sleek Spacing
//   const InputField = ({ label, name, type = "text", value, placeholder }) => (
//     <div className="group w-full">
//       <label className="block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors">
//         {label}
//       </label>
//       <input
//         type={type}
//         name={name}
//         value={value}
//         onChange={handleChange}
//         placeholder={placeholder}
//         className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 ease-in-out"
//       />
//     </div>
//   );

//   return (
//     <MainLayout>
//       {/* Container: Full Width with sleek padding */}
//       <div className="w-full px-4 py-4">

//         {/* Header & Breadcrumb */}
//         <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
//           <div>
//             {/* <nav className="text-sm text-gray-500 mb-1">
//               <ol className="list-none p-0 inline-flex">
//                 <li className="flex items-center">Home</li>
//                 <li className="flex items-center mx-2">/</li>
//                 <li className="flex items-center">Users</li>
//                 <li className="flex items-center mx-2">/</li>
//                 <li className="font-semibold text-green-600">Add User</li>
//               </ol>
//             </nav> */}
//             <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
//               Create New User
//             </h2>
//           </div>
//         </div>

//         {/* Main Form Card - Full Width */}
//         <div className="w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
//           {/* Decorative Top Bar: Green Gradient */}
//           <div className="h-2 bg-gradient-to-r from-green-400 via-green-600 to-green-800"></div>

//           <form onSubmit={handleSubmit} className="p-6 space-y-6">

//             {/* Section 1: Personal Information */}
//             <section>
//               <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
//                 <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
//                   1
//                 </div>
//                 <h3 className="text-lg font-bold text-gray-800">
//                   Personal Information
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 <InputField
//                   label="Username"
//                   name="username"
//                   value={user.username}
//                   placeholder="e.g. jdoe123"
//                 />
//                 <InputField
//                   label="Email Address"
//                   name="email"
//                   type="email"
//                   value={user.email}
//                   placeholder="john@example.com"
//                 />
//               </div>
//             </section>

//             {/* Section 2: User Role */}
//             <section>
//               <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
//                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
//                   2
//                 </div>
//                 <h3 className="text-lg font-bold text-gray-800">
//                   Role & Department
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 <div className="group w-full">
//                   <label className="block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors">
//                     Assign Role
//                   </label>
//                   <div className="relative">
//                     <select
//                       name="role"
//                       value={user.role}
//                       onChange={handleChange}
//                       className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
//                     >
//                       <option value="">Select a Role...</option>
//                       <option>Admin</option>
//                       <option>Manager</option>
//                       <option>Support</option>
//                       <option>Customer</option>
//                     </select>
//                     <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
//                       <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
//                         <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
//                       </svg>
//                     </div>
//                   </div>
//                 </div>

//                 <InputField
//                   label="Department"
//                   name="department"
//                   value={user.department}
//                   placeholder="e.g. Marketing"
//                 />
//               </div>
//             </section>

//             {/* Section 3: Security */}
//             <section>
//               <div className="flex items-center gap-3 mb-4 border-b border-gray-100 pb-2">
//                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
//                   3
//                 </div>
//                 <h3 className="text-lg font-bold text-gray-800">
//                   Security
//                 </h3>
//               </div>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
//                 <InputField
//                   label="Password"
//                   name="password"
//                   type="password"
//                   value={user.password}
//                   placeholder="••••••••"
//                 />
//                 <InputField
//                   label="Confirm Password"
//                   name="confirmPassword"
//                   type="password"
//                   value={user.confirmPassword}
//                   placeholder="••••••••"
//                 />
//               </div>
//             </section>

//             {/* Action Buttons */}
//             <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-end border-t border-gray-100 mt-6">
//               <button
//                 type="button"
//                 className="px-6 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
//                 onClick={() => alert("Canceled")}
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 className="px-6 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-700/20 transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-600"
//               >
//                 Save User
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </MainLayout>
//   );
// }

import MainLayout from "../components/MainLayout";

import { useState, memo } from "react";

import { useNavigate } from "react-router-dom";

/* =======================

   REUSABLE INPUT FIELD

   (MOVED OUTSIDE)

======================= */

const InputField = memo(function InputField({
  label,

  name,

  type = "text",

  value,

  placeholder,

  onChange,
}) {
  return (
    <div className="group w-full">
      <label className="block text-sm font-semibold text-gray-600 mb-1.5 group-focus-within:text-green-700 transition-colors">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300

        text-gray-700 placeholder-gray-400 focus:outline-none focus:bg-white

        focus:ring-2 focus:ring-green-500 focus:border-transparent

        transition-all duration-200 ease-in-out"
      />
    </div>
  );
});

/* =======================

        MAIN PAGE

======================= */

export default function AddUser() {
  const [user, setUser] = useState({
    username: "",

    email: "",

    role: "",

    department: "",

    password: "",

    confirmPassword: "",
  });

  const navigate = useNavigate();

  const API_URL = `${process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api"}/cs`;

  /* 🔧 FIXED STATE UPDATE */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUser((prev) => ({
      ...prev,

      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.password !== user.confirmPassword) {
      alert("Passwords do not match");

      return;
    }

    const payload = {
      full_name: user.username,

      email: user.email,

      password: user.password,

      // send selected role value as-is; backend will normalize and store lowercase
      role: user.role || "user",

      phone: user.department || null,
    };

    try {
      const res = await fetch(`${API_URL}/users.php`, {
        method: "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.message || "Failed to create user");

        return;
      }

      console.debug("User created:", data.user);
      alert("User created successfully — role: " + (data.user?.role || "User"));

      navigate("/cs/user-list");
    } catch (err) {
      console.error(err);

      alert("Server error while creating user");
    }
  };

  return (
    <MainLayout>
      <div className="w-full px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Create New User
          </h2>
        </div>

        {/* Card */}
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-green-400 via-green-600 to-green-800" />

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Section 1 */}
            <section>
              <h3 className="font-bold mb-3">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Username"
                  name="username"
                  value={user.username}
                  placeholder="e.g. jdoe123"
                  onChange={handleChange}
                />
                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  value={user.email}
                  placeholder="john@example.com"
                  onChange={handleChange}
                />
              </div>
            </section>

            {/* Section 2 */}
            <section>
              <h3 className="font-bold mb-3">Role & Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="group w-full">
                  <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                    Assign Role
                  </label>
                  <select
                    name="role"
                    value={user.role}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300

                    text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a Role...</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="support">Support</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>

                <InputField
                  label="Department"
                  name="department"
                  value={user.department}
                  placeholder="e.g. Marketing"
                  onChange={handleChange}
                />
              </div>
            </section>

            {/* Section 3 */}
            <section>
              <h3 className="font-bold mb-3">Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <InputField
                  label="Password"
                  name="password"
                  type="password"
                  value={user.password}
                  placeholder="••••••••"
                  onChange={handleChange}
                />
                <InputField
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={user.confirmPassword}
                  placeholder="••••••••"
                  onChange={handleChange}
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700"
              >
                Save User
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
