import React, { useState, useEffect } from 'react';
import { FiStar, FiX, FiLoader, FiCheckCircle } from 'react-icons/fi';

export default function ReviewModal({ 
  isOpen, 
  onClose, 
  productId, 
  productName,
  onReviewSubmitted 
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "https://uptulathemehub.com/backend/api";

  useEffect(() => {
    if (isOpen && productId) {
      checkExistingReview();
    }
  }, [isOpen, productId]);

  const checkExistingReview = async () => {
    try {
      // Use the user-review endpoint to get the current user's review (including pending)
      const res = await fetch(`${API_URL}/user-review.php?product_id=${productId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      
      if (data.success && data.review) {
        setHasReviewed(true);
        setExistingReview(data.review);
        setRating(data.review.rating);
        setTitle(data.review.title || '');
        setReviewText(data.review.review_text || '');
      } else {
        setHasReviewed(false);
        setExistingReview(null);
        setRating(5);
        setTitle('');
        setReviewText('');
      }
    } catch (err) {
      console.error('Check review error:', err);
      setHasReviewed(false);
      setExistingReview(null);
      setRating(5);
      setTitle('');
      setReviewText('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reviewText.trim()) {
      setError('Please write your review');
      return;
    }

    if (rating < 1 || rating > 5) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API_URL}/reviews.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          product_id: productId,
          rating: rating,
          title: title.trim(),
          review_text: reviewText.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Review submitted successfully! It will be visible after admin approval.');
        setTimeout(() => {
          if (onReviewSubmitted) {
            onReviewSubmitted();
          }
          handleClose();
        }, 2000);
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(5);
    setTitle('');
    setReviewText('');
    setError('');
    setSuccess('');
    setHasReviewed(false);
    setExistingReview(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">
            {hasReviewed ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {productName && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Reviewing:</p>
              <p className="font-semibold text-gray-900">{productName}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {hasReviewed && existingReview && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                You have already reviewed this product. Submitting a new review will replace your existing review.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Star Rating */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={(e) => {
                      // Highlight stars on hover
                      const stars = e.currentTarget.parentElement.querySelectorAll('button');
                      stars.forEach((s, idx) => {
                        if (idx < star) {
                          s.querySelector('svg').style.color = '#fbbf24';
                          s.querySelector('svg').style.fill = '#fbbf24';
                        }
                      });
                    }}
                    onMouseLeave={(e) => {
                      // Reset to selected rating
                      const stars = e.currentTarget.parentElement.querySelectorAll('button');
                      stars.forEach((s, idx) => {
                        const svg = s.querySelector('svg');
                        if (idx < rating) {
                          svg.style.color = '#fbbf24';
                          svg.style.fill = '#fbbf24';
                        } else {
                          svg.style.color = '#d1d5db';
                          svg.style.fill = 'none';
                        }
                      });
                    }}
                  >
                    <FiStar
                      className="w-8 h-8 transition-colors"
                      style={{
                        color: star <= rating ? '#fbbf24' : '#d1d5db',
                        fill: star <= rating ? '#fbbf24' : 'none'
                      }}
                    />
                  </button>
                ))}
                <span className="ml-3 text-gray-600 font-medium">
                  {rating === 5 ? 'Excellent' :
                   rating === 4 ? 'Good' :
                   rating === 3 ? 'Average' :
                   rating === 2 ? 'Poor' :
                   'Very Poor'}
                </span>
              </div>
            </div>

            {/* Review Title */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Title <span className="text-gray-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Great template, highly recommended!"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                maxLength={255}
              />
            </div>

            {/* Review Text */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Review <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this template. What did you like? What could be improved?"
                rows={6}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewText.length}/2000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !reviewText.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiStar className="w-5 h-5" />
                    {hasReviewed ? 'Update Review' : 'Submit Review'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
