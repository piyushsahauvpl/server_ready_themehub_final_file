// import React, { useRef, useState } from "react";
// import { FaPaperclip } from "react-icons/fa";
// import MainLayout from "../components/MainLayout";

// function RaiseTicket() {
//   const fileInputRef = useRef(null);
//   const [attachedFile, setAttachedFile] = useState(null);
//   const [subject, setSubject] = useState("");
//   const [description, setDescription] = useState("");
//   const [category, setCategory] = useState("Problem");
//   const [priority, setPriority] = useState("Medium");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [success, setSuccess] = useState("");

//   const handleAttachClick = (e) => {
//     e.preventDefault();
//     if (fileInputRef.current) fileInputRef.current.click();
//   };

//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       setAttachedFile(e.target.files[0]);
//     }
//   };

//   const handleCategoryChange = (e) => setCategory(e.target.value);
//   const handlePriorityChange = (e) => setPriority(e.target.value);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");
//     setSuccess("");
//     try {
//       const formData = new FormData();
//       formData.append("subject", subject);
//       formData.append("description", description);
//       formData.append("category", category);
//       formData.append("priority", priority);
//       if (attachedFile) formData.append("attachment", attachedFile);
//       const res = await fetch("https://uptulathemehub.com/backend/api/tickets.php", {
//         method: "POST",
//         body: formData,
//       });
//       const data = await res.json();
//       if (res.ok && data.success) {
//         setSuccess("Ticket submitted successfully! Ticket #: " + data.ticket_number);
//         setSubject("");
//         setDescription("");
//         setCategory("Problem");
//         setPriority("Medium");
//         setAttachedFile(null);
//       } else {
//         setError(data.error || "Failed to submit ticket.");
//       }
//     } catch (err) {
//       setError("Network error. Please try again.");
//     }
//     setLoading(false);
//   };

//   return (
//     <MainLayout>
//       <div className="min-h-screen bg-gray-100 p-6">
//         <h6 className="mb-4 font-semibold text-gray-800">
//           Raise a ticket
//         </h6>
//         {error && <div className="text-red-600 mb-2">{error}</div>}
//         {success && <div className="text-green-600 mb-2">{success}</div>}
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
//             {/* LEFT PANEL */}
//             <div className="md:col-span-3">
//               <div className="bg-white rounded-xl shadow p-4">
//                 {/* Category */}
//                 <div className="mb-3">
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
//                   <select
//                     className="w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                     value={category}
//                     onChange={handleCategoryChange}
//                   >
//                     <option value="Problem">Problem</option>
//                     <option value="Question">Question</option>
//                     <option value="Feature Request">Feature Request</option>
//                   </select>
//                 </div>
//                 {/* Priority */}
//                 <div className="mb-3">
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">Priority</label>
//                   <select
//                     className="w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                     value={priority}
//                     onChange={handlePriorityChange}
//                   >
//                     <option value="Low">Low</option>
//                     <option value="Medium">Medium</option>
//                     <option value="High">High</option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//             {/* RIGHT PANEL */}
//             <div className="md:col-span-9">
//               <div className="bg-white rounded-xl shadow p-4">
//                 {/* Subject */}
//                 <div className="mb-3">
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">
//                     Subject
//                   </label>
//                   <input
//                     type="text"
//                     className="w-full text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                     value={subject}
//                     onChange={e => setSubject(e.target.value)}
//                   />
//                 </div>
//                 {/* Description */}
//                 <div className="mb-2">
//                   <label className="block text-xs font-semibold text-gray-600 mb-1">
//                     Description{" "}
//                     <span className="text-gray-400">
//                       (Optional)
//                     </span>
//                   </label>
//                   {/* Toolbar */}
//                   <div className="flex items-center gap-4 text-sm border border-b-0 rounded-t-lg px-3 py-2 bg-gray-50 text-gray-600">
//                     <span className="font-bold cursor-pointer">B</span>
//                     <span className="italic cursor-pointer">I</span>
//                     <span className="underline cursor-pointer">U</span>
//                     <span className="cursor-pointer">A</span>
//                     <span className="cursor-pointer">≡</span>
//                   </div>
//                   <textarea
//                     rows={6}
//                     className="w-full text-sm border rounded-b-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
//                     value={description}
//                     onChange={e => setDescription(e.target.value)}
//                   />
//                 </div>
//                 {/* Actions */}
//                 <div className="flex justify-between items-center mt-4">
//                   <div className="flex items-center gap-2">
//                     <button
//                       className="flex items-center gap-2 text-blue-600 text-sm hover:underline"
//                       onClick={handleAttachClick}
//                       type="button"
//                     >
//                       <FaPaperclip />
//                       Attach file
//                     </button>
//                     <input
//                       type="file"
//                       ref={fileInputRef}
//                       style={{ display: "none" }}
//                       onChange={handleFileChange}
//                     />
//                     {attachedFile && (
//                       <span className="ml-2 text-xs text-gray-600">{attachedFile.name}</span>
//                     )}
//                   </div>
//                   <button
//                     className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg"
//                     type="submit"
//                     disabled={loading}
//                   >
//                     {loading ? "Submitting..." : "Submit a ticket"}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </form>
//       </div>
//     </MainLayout>
//   );
// }

// export default RaiseTicket;






import React, { useRef, useState } from "react";
import { FaPaperclip, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import MainLayout from "../components/MainLayout";

function RaiseTicket() {
  const fileInputRef = useRef(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Problem");
  const [priority, setPriority] = useState("Medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAttachClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) setAttachedFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("category", category);
      formData.append("priority", priority);
      if (attachedFile) formData.append("attachment", attachedFile);

      const res = await fetch(
        "https://uptulathemehub.com/backend/api/tickets.php",
        { method: "POST", body: formData }
      );

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(`Ticket submitted successfully • #${data.ticket_number}`);
        setSubject("");
        setDescription("");
        setCategory("Problem");
        setPriority("Medium");
        setAttachedFile(null);
      } else {
        setError(data.error || "Failed to submit ticket.");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          {/* Page header */}
          <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600">
                Support Center
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">
                Raise a Support Ticket
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Describe your issue and the team will respond as soon as possible.
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-50/50 px-3 py-1.5 text-xs text-emerald-800 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Average response time: within 24 hours
            </div>
          </header>

          {/* Alerts */}
          <div className="mb-6 space-y-3">
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm">
                <FaExclamationCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 shadow-sm">
                <FaCheckCircle className="h-4 w-4 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 lg:grid-cols-12">
              {/* LEFT PANEL */}
              <aside className="lg:col-span-4">
                <div className="sticky top-6 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-sm backdrop-blur-sm">
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">
                    Ticket details
                  </h2>
                  <p className="mb-6 text-xs text-slate-500">
                    Help the team prioritize your request by selecting the right options.
                  </p>

                  <div className="space-y-4">
                    {/* Category */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700">
                        Category
                      </label>
                      <select
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option>Problem</option>
                        <option>Question</option>
                        <option>Feature Request</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className="mb-2 block text-xs font-medium text-slate-700">
                        Priority
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        {["Low", "Medium", "High"].map((level) => {
                          const isActive = priority === level;
                          return (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setPriority(level)}
                              className={[
                                "flex items-center justify-center rounded-lg border px-3 py-2 font-medium transition-all duration-200",
                                isActive
                                  ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "mr-2 h-2 w-2 rounded-full",
                                  level === "Low" && "bg-emerald-400",
                                  level === "Medium" && "bg-amber-400",
                                  level === "High" && "bg-red-500",
                                ].filter(Boolean).join(" ")}
                              />
                              {level}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Hint */}
                    <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 px-3 py-2.5 text-xs text-amber-900 font-medium">
                      For critical production issues, select High and give as much context as possible.
                    </div>
                  </div>
                </div>
              </aside>

              {/* RIGHT PANEL */}
              <section className="lg:col-span-8">
                <div className="rounded-2xl border border-slate-200/60 bg-white/80 p-8 shadow-sm backdrop-blur-sm">
                  {/* Subject */}
                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-medium text-slate-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      placeholder="Brief summary of your issue"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  {/* Description - REMOVED TOOLBAR */}
                  <div className="mb-8">
                    <label className="mb-3 block text-xs font-medium text-slate-700">
                      Description{" "}
                      <span className="text-xs font-normal text-slate-500">
                        (optional but recommended)
                      </span>
                    </label>

                    <textarea
                      rows={6}
                      placeholder="Explain what you expected to happen, what actually happened, and any steps to reproduce..."
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 outline-none transition resize-vertical hover:border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleAttachClick}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-100 hover:shadow-md"
                      >
                        <FaPaperclip className="h-3.5 w-3.5" />
                        Attach file
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        onChange={handleFileChange}
                      />
                      {attachedFile && (
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs text-emerald-800 font-medium shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          {attachedFile.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 self-end">
                      <p className="hidden text-xs text-slate-500 sm:block">
                        You can track the status of this ticket in your support dashboard.
                      </p>
                      <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-emerald-700 active:scale-[0.98] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                      >
                        {loading ? "Submitting…" : "Submit ticket"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

export default RaiseTicket;
