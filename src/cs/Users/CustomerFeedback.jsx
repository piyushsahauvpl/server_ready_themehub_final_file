import React, { useState } from "react";
import MainLayout from "../components/MainLayout";
import { FaStar } from "react-icons/fa";
 
function CustomerFeedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
 
  const submitFeedback = (e) => {
    e.preventDefault();
 
    if (rating === 0 || comment.trim() === "") {
      alert("Please provide rating and feedback");
      return;
    }
 
    const newFeedback = {
      id: feedbackList.length + 1,
      rating,
      comment,
      date: new Date().toLocaleDateString(),
    };
 
    setFeedbackList([newFeedback, ...feedbackList]);
    setRating(0);
    setComment("");
  };
 
  return (
    <MainLayout>
      {/* <div className="min-h-screen bg-gray-100 p-6"> */}
        {/* Header */}
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-gray-800">
            Customer Feedback
          </h3>
          <p className="text-gray-500">
            View customer ratings and feedback
          </p>
        </div>
 
        {/* <div className="grid grid-cols-1 lg:grid-cols-12 gap-6"> */}
          {/* Feedback Form */}
          {/* <div className="lg:col-span-4">
            <div className="bg-white rounded-xl shadow p-5"> */}
              {/* <h4 className="font-semibold text-lg mb-4">
                Submit Feedback
              </h4> */}
 
              {/* <form onSubmit={submitFeedback} className="space-y-4"> */}
                {/* Rating */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        size={28}
                        className="cursor-pointer transition"
                        color={star <= rating ? "#facc15" : "#e5e7eb"}
                        onClick={() => setRating(star)}
                      />
                    ))}
                  </div>
                </div> */}
 
                {/* Feedback */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Feedback
                  </label>
                  <textarea
                    rows="4"
                    className="w-full rounded-lg border border-gray-300 p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Write your feedback here..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div> */}
 
                {/* <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                >
                  Submit Feedback
                </button> */}
             
           
         
 
          {/* Feedback List */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow p-5">
              <h4 className="font-semibold text-lg mb-4">
                Feedback Records
              </h4>
 
              {feedbackList.length === 0 ? (
                <p className="text-gray-500">
                  No feedback submitted yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                          #
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                          Rating
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                          Feedback
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackList.map((fb) => (
                        <tr
                          key={fb.id}
                          className="border-t hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-sm">
                            {fb.id}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-1">
                              {[...Array(fb.rating)].map((_, i) => (
                                <FaStar
                                  key={i}
                                  size={16}
                                  color="#facc15"
                                />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-700">
                            {fb.comment}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">
                            {fb.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
       
   
    </MainLayout>
  );
}
 
export default CustomerFeedback;
 
