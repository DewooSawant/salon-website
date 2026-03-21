import { useState, useEffect } from 'react'
import { FiStar, FiSend, FiMessageCircle } from 'react-icons/fi'
import SalonOwnerLayout, { useSalonOwnerApi } from '../../components/marketplace/SalonOwnerLayout'
import toast from 'react-hot-toast'

export default function SalonOwnerReviews() {
  const api = useSalonOwnerApi()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchReviews() }, [])

  const fetchReviews = async () => {
    try {
      const res = await api.get('/salon-owner/reviews')
      setReviews(res.data.reviews)
    } catch { toast.error('Failed to load reviews') }
    finally { setLoading(false) }
  }

  const submitReply = async (reviewId, reply) => {
    try {
      await api.post(`/salon-owner/reviews/${reviewId}/reply`, { reply })
      toast.success('Reply posted')
      fetchReviews()
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to post reply') }
  }

  // Stats
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0'
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }))

  if (loading) {
    return (
      <SalonOwnerLayout title="Reviews">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </SalonOwnerLayout>
    )
  }

  return (
    <SalonOwnerLayout title="Reviews">
      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FiStar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">No reviews yet</h3>
          <p className="text-gray-500">Reviews from customers will appear here</p>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-gray-900 mb-1">{avgRating}</div>
                <div className="flex gap-0.5 justify-center mb-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <FiStar key={i} className={`w-5 h-5 ${i <= Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-gray-500">{reviews.length} reviews</p>
              </div>
              <div className="flex-1 w-full sm:w-auto space-y-2">
                {ratingDist.map(r => (
                  <div key={r.star} className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-4 text-right">{r.star}</span>
                    <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} onReply={submitReply} />
            ))}
          </div>
        </>
      )}
    </SalonOwnerLayout>
  )
}

function ReviewCard({ review, onReply }) {
  const [showReply, setShowReply] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async () => {
    if (!replyText.trim()) return
    setSending(true)
    await onReply(review.id, replyText)
    setReplyText('')
    setShowReply(false)
    setSending(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm">
            {review.customer_name?.charAt(0)}
          </div>
          <div>
            <span className="font-semibold text-gray-900">{review.customer_name}</span>
            {review.created_at && (
              <p className="text-xs text-gray-400">{new Date(review.created_at).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50">
          <FiStar className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span className="font-bold text-amber-700">{review.rating}</span>
        </div>
      </div>

      {review.review && <p className="text-gray-600 mb-3 leading-relaxed">{review.review}</p>}

      {/* Owner Reply */}
      {review.owner_reply ? (
        <div className="p-3 rounded-xl bg-brand-50 border border-brand-100 mb-3">
          <p className="text-sm font-medium text-brand-700 mb-0.5">Your reply</p>
          <p className="text-sm text-brand-600">{review.owner_reply}</p>
        </div>
      ) : (
        <>
          {!showReply ? (
            <button onClick={() => setShowReply(true)}
              className="flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 font-medium transition">
              <FiMessageCircle className="w-4 h-4" /> Reply
            </button>
          ) : (
            <div className="flex gap-2 mt-2">
              <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Write your reply..."
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="flex-1 p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-400" />
              <button onClick={handleSubmit} disabled={sending || !replyText.trim()}
                className="p-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition disabled:opacity-50">
                <FiSend className="w-4 h-4" />
              </button>
              <button onClick={() => setShowReply(false)} className="p-3 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
