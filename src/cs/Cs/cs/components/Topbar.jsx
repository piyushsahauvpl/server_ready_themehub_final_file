import { FiUser, FiLogOut, FiBell, FiMail } from "react-icons/fi";
import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Topbar({ collapsed }) {
  const [openProfile, setOpenProfile] = useState(false);
  const [openNotify, setOpenNotify] = useState(false);
  const [openMail, setOpenMail] = useState(false);

  const navigate = useNavigate();
  const notifyRef = useRef();
  const mailRef = useRef();
  const profileRef = useRef();

  const alerts = [
    { color: "bg-blue-500", date: "December 12, 2025", text: "A new monthly report is ready to download!" },
    { color: "bg-green-500", date: "December 7, 2025", text: "₹290.29 has been deposited to your account." },
    { color: "bg-yellow-500", date: "December 2, 2025", text: "Spending Alert: Unusually high spending detected." },
  ];

  const messages = [
    { avatar: "https://randomuser.me/api/portraits/women/44.jpg", sender: "Emily Fowler", text: "Hi there! I am wondering if you have the files ready...", time: "58m" },
    { avatar: "https://randomuser.me/api/portraits/men/33.jpg", sender: "Jae Chun", text: "I have the photos you ordered last month.", time: "1d" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("auth");
    navigate("/cs/login", { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target)) setOpenNotify(false);
      if (mailRef.current && !mailRef.current.contains(e.target)) setOpenMail(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setOpenProfile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`
        fixed top-0 right-0 h-[72px]
        bg-white shadow flex items-center justify-between
        px-6 z-40 transition-all duration-300  rounded-t-3xl rounded-b-3xl ml-4 mr-4 mt-2
        ${collapsed ? "left-28" : "left-60"}
      `}
    >
      <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>

      <div className="flex items-center gap-6 relative">

        {/* NOTIFICATIONS */}
        <div ref={notifyRef} className="relative cursor-pointer" onClick={() => {
          setOpenNotify(!openNotify);
          setOpenMail(false);
          setOpenProfile(false);
        }}>
          <FiBell size={22} />
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full px-2">
            {alerts.length}
          </span>

          {openNotify && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border">
              <div className="px-4 py-2 bg-blue-600 text-white font-semibold">
                Alerts Center
              </div>
              <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
                {alerts.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${a.color}`}>
                      <FiBell />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{a.date}</p>
                      <p className="text-sm">{a.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

         {/* MESSAGE CENTER */}
        <div
          className="relative cursor-pointer"
          ref={mailRef}
          onClick={() => {
            setOpenMail(!openMail);
            setOpenNotify(false);
            setOpenProfile(false);
          }}
        >
          <FiMail size={22} className="text-gray-700" />

          {openMail && (
            <div
              className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-lg border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-4 py-2 bg-blue-600 text-white font-semibold">
                Message Center
              </div>

              <div className="p-3 space-y-4 max-h-80 overflow-y-auto">
                {messages.map((msg, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <img
                      src={msg.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-gray-800 font-medium">
                        {msg.text.substring(0, 35)}...
                      </p>
                      <p className="text-xs text-gray-500">
                        {msg.sender} • {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="py-2 text-center text-blue-600 text-sm hover:bg-gray-100 cursor-pointer">
                Read More Messages
              </div>
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div ref={profileRef} className="relative cursor-pointer flex items-center gap-2" onClick={() => {
          setOpenProfile(!openProfile);
          setOpenNotify(false);
          setOpenMail(false);
        }}>
          <FiUser />
          <span className="font-medium">Admin ▾</span>

          {openProfile && (
            <div className="absolute right-0 top-[56px] w-44 bg-white border shadow rounded-lg">
              <Link to="">
                <button className="w-full px-4 py-2 text-left hover:bg-gray-100">
                  Settings
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100 flex items-center gap-2"
              >
                <FiLogOut /> Logout
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
