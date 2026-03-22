import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  FiMapPin, FiCalendar, FiStar, FiArrowRight, FiScissors, FiUsers,
  FiTrendingUp, FiSearch, FiClock, FiShield, FiCheckCircle, FiHeart,
  FiZap, FiAward, FiSmile
} from 'react-icons/fi'
import MarketplaceNavbar from '../../components/marketplace/MarketplaceNavbar'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const popularCategories = [
  { name: 'Haircut', icon: '✂️', color: 'from-purple-500 to-purple-600', query: 'haircut' },
  { name: 'Beard', icon: '🧔', color: 'from-amber-500 to-orange-500', query: 'beard' },
  { name: 'Hair Color', icon: '🎨', color: 'from-pink-500 to-rose-500', query: 'color' },
  { name: 'Facial', icon: '✨', color: 'from-emerald-500 to-teal-500', query: 'facial' },
  { name: 'Hair Spa', icon: '💆', color: 'from-blue-500 to-indigo-500', query: 'spa' },
  { name: 'Massage', icon: '🧴', color: 'from-violet-500 to-purple-500', query: 'massage' },
]

const stats = [
  { value: '500+', label: 'Salons Listed', icon: FiScissors },
  { value: '10K+', label: 'Happy Customers', icon: FiSmile },
  { value: '50K+', label: 'Bookings Made', icon: FiCalendar },
  { value: '4.8', label: 'Avg Rating', icon: FiStar },
]

const howItWorks = [
  {
    step: 1,
    icon: FiSearch,
    title: 'Discover',
    desc: 'Search salons near you. Filter by type, rating, price, and services.',
    color: 'bg-brand-100 text-brand-600',
  },
  {
    step: 2,
    icon: FiCalendar,
    title: 'Book Instantly',
    desc: 'Pick your services, choose a time slot, and confirm in seconds.',
    color: 'bg-accent-100 text-accent-600',
  },
  {
    step: 3,
    icon: FiStar,
    title: 'Enjoy & Review',
    desc: 'Visit the salon, enjoy premium service, and leave your feedback.',
    color: 'bg-amber-100 text-amber-600',
  },
]

const trustSignals = [
  { icon: FiShield, text: 'Verified Salons' },
  { icon: FiCheckCircle, text: 'Real Reviews' },
  { icon: FiZap, text: 'Instant Booking' },
  { icon: FiClock, text: 'No Waiting' },
]

const testimonials = [
  {
    name: 'Aniket P.',
    text: 'Found the perfect salon near my home. Booking was seamless!',
    rating: 5,
    avatar: 'A',
  },
  {
    name: 'Sneha K.',
    text: 'Love how I can compare prices and read reviews before booking.',
    rating: 5,
    avatar: 'S',
  },
  {
    name: 'Rahul J.',
    text: 'No more waiting in queues. I book my slot and walk in on time.',
    rating: 5,
    avatar: 'R',
  },
]

function FeaturedSalonCard({ salon }) {
  return (
    <Link
      to={`/salon/${salon.slug}`}
      className="group flex-shrink-0 w-72 bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-brand-200"
    >
      <div className="relative h-40 bg-gradient-to-br from-brand-600 to-accent-500 overflow-hidden">
        {salon.cover_image_url && (
          <img src={salon.cover_image_url} alt={salon.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-gray-800 capitalize backdrop-blur-sm">
            {salon.type}
          </span>
          {salon.is_verified && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>
        {salon.avg_rating && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-white/95 backdrop-blur-sm">
            <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-gray-800">{salon.avg_rating}</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-1">{salon.name}</h3>
        {salon.tagline && <p className="text-sm text-gray-500 mb-2 line-clamp-1">{salon.tagline}</p>}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <FiMapPin className="w-3.5 h-3.5 mr-1 shrink-0 text-gray-400" />
          <span className="truncate">{salon.address}, {salon.city}</span>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-xs text-gray-500">
            <FiClock className="w-3 h-3 mr-1" />
            {salon.opening_time?.slice(0, 5)} - {salon.closing_time?.slice(0, 5)}
          </div>
          {salon.starting_price && (
            <span className="text-sm font-bold text-brand-600">
              From ₹{Math.round(salon.starting_price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredSalons, setFeaturedSalons] = useState([])
  const [loadingSalons, setLoadingSalons] = useState(true)

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        // Try to get nearby salons for featured section
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try {
                const res = await axios.get(`${API_URL}/salons/nearby`, {
                  params: { lat: pos.coords.latitude, lng: pos.coords.longitude, radius: 25000, sort: 'rating', limit: 8 }
                })
                setFeaturedSalons(res.data.salons || [])
              } catch { setFeaturedSalons([]) }
              setLoadingSalons(false)
            },
            () => setLoadingSalons(false),
            { timeout: 5000 }
          )
        } else {
          setLoadingSalons(false)
        }
      } catch {
        setLoadingSalons(false)
      }
    }
    fetchFeatured()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(`/discover${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ''}`)
  }

  const handleCategoryClick = (query) => {
    navigate(`/discover?search=${encodeURIComponent(query)}`)
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketplaceNavbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24 px-4 overflow-hidden bg-hero-pattern">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-100 rounded-full blur-3xl opacity-40 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-100 rounded-full blur-3xl opacity-40 translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-6xl mx-auto text-center">
          {/* Trust badges - above hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {trustSignals.map((signal) => (
              <span
                key={signal.text}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600"
              >
                <signal.icon className="w-3.5 h-3.5 text-brand-600" />
                {signal.text}
              </span>
            ))}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight"
          >
            Book the Best
            <span className="bg-gradient-to-r from-brand-600 via-accent-500 to-brand-600 bg-clip-text text-transparent"> Salons </span>
            <br className="hidden sm:block" />
            Near You
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Discover top-rated salons, compare prices, read real reviews, and book appointments instantly. No more waiting in queues.
          </motion.p>

          {/* Search Bar - Industry standard hero search */}
          <motion.form
            onSubmit={handleSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="max-w-2xl mx-auto mb-6"
          >
            <div className="flex items-center bg-white rounded-2xl shadow-brand border border-gray-200 hover:border-purple-300 hover:shadow-brand-lg transition-all p-2">
              <div className="flex-1 flex items-center gap-2 pl-4">
                <FiSearch className="w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search salons, services, or areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full py-3 text-gray-700 placeholder-gray-400 outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 sm:px-8 py-3.5 bg-brand-gradient-r text-white rounded-xl font-semibold transition-all shadow-brand text-sm sm:text-base whitespace-nowrap"
              >
                Find Salons
              </button>
            </div>
          </motion.form>

          {/* Quick actions below search */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-2 text-sm text-gray-500"
          >
            <span>Popular:</span>
            {['Haircut near me', 'Hair Spa', 'Beard Trim', 'Unisex Salon'].map((tag) => (
              <button
                key={tag}
                onClick={() => { setSearchQuery(tag); navigate(`/discover?search=${encodeURIComponent(tag)}`) }}
                className="text-brand-600 hover:text-brand-700 hover:underline transition"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Salon Owner Quick Access Banner */}
      {(() => { const isSalonOwner = !!localStorage.getItem('salonOwnerToken'); return (
      <section className="px-4 py-3 bg-gradient-to-r from-brand-50 to-accent-50 border-y border-brand-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg shrink-0">💈</span>
            <p className="text-sm text-gray-700 truncate">
              {isSalonOwner ? (
                <span className="font-semibold">Welcome back! Go to your dashboard</span>
              ) : (
                <>
                  <span className="font-semibold">Own a salon?</span>
                  <span className="hidden sm:inline"> Manage bookings, billing & grow your business</span>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={isSalonOwner ? "/salon-owner/dashboard" : "/salon-owner/login"}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-brand-700 transition whitespace-nowrap"
            >
              {isSalonOwner ? 'My Dashboard' : 'Salon Login'}
            </Link>
            {!isSalonOwner && <Link
              to="/salon-owner/register"
              className="hidden sm:inline-block px-4 py-2 border border-brand-300 text-brand-700 rounded-xl text-sm font-semibold hover:bg-brand-50 transition whitespace-nowrap"
            >
              Register Free
            </Link>}
          </div>
        </div>
      </section>
      )})()}

      {/* Stats Bar */}
      <section className="py-8 px-4 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 justify-center"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs text-gray-500">{stat.label}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Browse by Service</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Find exactly what you need. Pick a service and discover the best salons offering it.</p>
          </motion.div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {popularCategories.map((cat, i) => (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleCategoryClick(cat.query)}
                className="group flex flex-col items-center gap-3 p-4 sm:p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-brand-50 hover:shadow-brand-lg transition-all duration-300"
              >
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-2xl sm:text-3xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {cat.icon}
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-brand-700 transition-colors">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Salons */}
      {featuredSalons.length > 0 && (
        <section className="py-16 sm:py-20 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Top Rated Near You</h2>
                <p className="text-gray-500">Highest-rated salons in your area</p>
              </div>
              <Link
                to="/discover"
                className="hidden sm:flex items-center gap-1 text-brand-600 font-semibold hover:text-brand-700 transition"
              >
                View All <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {featuredSalons.map((salon, i) => (
                <motion.div
                  key={salon.id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="snap-start"
                >
                  <FeaturedSalonCard salon={salon} />
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-6 sm:hidden">
              <Link
                to="/discover"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-50 text-brand-600 rounded-xl font-semibold hover:bg-brand-100 transition"
              >
                View All Salons <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-sm font-semibold mb-4">
              Simple & Fast
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">How It Works</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Book your perfect appointment in 3 simple steps</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line - desktop only */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-brand-200 via-accent-200 to-amber-200" />

            {howItWorks.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative bg-white rounded-2xl p-8 text-center border border-gray-100 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-100/30 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mx-auto mb-5 relative z-10`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-xs font-bold text-gray-500 mb-3">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Loved by Thousands</h2>
            <p className="text-gray-500">See what our customers have to say</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <FiStar
                      key={s}
                      className={`w-4 h-4 ${s <= t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gradient-r flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <span className="font-semibold text-gray-800">{t.name}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* For Salon Owners CTA */}
      <section className="py-16 sm:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 rounded-3xl p-8 sm:p-12 md:p-16 text-white overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-500/20 rounded-full blur-3xl" />

            <div className="relative max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
                <FiAward className="w-4 h-4" /> For Salon Owners
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Grow Your Salon Business Online
              </h2>
              <p className="text-lg text-white/80 mb-8 max-w-2xl leading-relaxed">
                Join Stylo and get discovered by thousands of customers in your area.
                Manage bookings, services, and staff — all from one powerful dashboard.
              </p>

              <div className="grid sm:grid-cols-3 gap-6 mb-10">
                {[
                  { icon: FiUsers, title: 'Get Discovered', desc: 'Customers find you by location & services' },
                  { icon: FiCalendar, title: 'Online Booking', desc: 'Accept bookings 24/7 automatically' },
                  { icon: FiTrendingUp, title: 'Grow Revenue', desc: 'Analytics, insights & marketing tools' },
                ].map((f) => (
                  <div key={f.title} className="flex flex-col items-start gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <f.icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold">{f.title}</h4>
                    <p className="text-sm text-white/70">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/for-salon-owners"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 rounded-2xl text-lg font-bold hover:bg-gray-100 transition shadow-xl"
                >
                  Learn More <FiArrowRight />
                </Link>
                <Link
                  to="/salon-owner/register"
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white rounded-2xl text-lg font-semibold hover:bg-white/10 transition"
                >
                  Register Your Salon Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-brand-gradient-r flex items-center justify-center">
                  <FiScissors className="text-white w-4 h-4" />
                </div>
                <span className="text-xl font-bold">Stylo</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-sm leading-relaxed">
                Book. Style. Shine.. Find, compare, and book the best salons near you in seconds.
              </p>
              <div className="flex gap-3">
                {trustSignals.map((signal) => (
                  <span
                    key={signal.text}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-400"
                  >
                    <signal.icon className="w-3 h-3 text-brand-400" />
                    {signal.text}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Customers</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link to="/discover" className="hover:text-white transition">Find Salons</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Customer Login</Link></li>
                <li><Link to="/my-bookings" className="hover:text-white transition">My Bookings</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">For Salon Owners</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li><Link to="/for-salon-owners" className="hover:text-white transition">Why Stylo?</Link></li>
                <li><Link to="/salon-owner/register" className="hover:text-white transition">Register Salon</Link></li>
                <li><Link to="/salon-owner/login" className="hover:text-white transition">Salon Login</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Stylo. All rights reserved.</p>
            <p className="flex items-center gap-1">Made with <FiHeart className="text-pink-500 w-3.5 h-3.5" /> in Pune, India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
