import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMapPin, FiStar, FiClock, FiSearch, FiFilter, FiHeart,
  FiNavigation, FiChevronDown, FiX, FiCheckCircle, FiSliders
} from 'react-icons/fi'
import { useCustomer } from '../../context/CustomerContext'
import MarketplaceNavbar from '../../components/marketplace/MarketplaceNavbar'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const serviceCategories = [
  { label: 'All', value: '', icon: '✨' },
  { label: 'Haircut', value: 'haircut', icon: '✂️' },
  { label: 'Beard', value: 'beard', icon: '🧔' },
  { label: 'Hair Color', value: 'color', icon: '🎨' },
  { label: 'Facial', value: 'facial', icon: '✨' },
  { label: 'Hair Spa', value: 'spa', icon: '💆' },
  { label: 'Massage', value: 'massage', icon: '🧴' },
  { label: 'Bridal', value: 'bridal', icon: '💍' },
]

const salonTypes = [
  { label: 'All Types', value: '' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
]

const sortOptions = [
  { label: 'Nearest', value: 'distance' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Lowest Price', value: 'price' },
  { label: 'Most Popular', value: 'popular' },
]

function SalonCard({ salon, onFavorite, isFavorite }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group bg-white rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      {/* Cover Image */}
      <div className="relative h-44 sm:h-48 bg-gradient-to-br from-purple-500 to-pink-500 overflow-hidden">
        {salon.cover_image_url ? (
          <img
            src={salon.cover_image_url}
            alt={salon.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl opacity-50">💇</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 text-gray-800 capitalize backdrop-blur-sm">
            {salon.type}
          </span>
          {salon.is_verified && (
            <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-500/90 text-white backdrop-blur-sm flex items-center gap-1">
              <FiCheckCircle className="w-3 h-3" /> Verified
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFavorite(salon.id) }}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white hover:scale-110 transition-all shadow-sm"
        >
          <FiHeart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`} />
        </button>

        {/* Distance Badge */}
        {salon.distance_km !== undefined && (
          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-medium bg-black/60 text-white flex items-center gap-1 backdrop-blur-sm">
            <FiNavigation className="w-3 h-3" /> {salon.distance_km} km
          </span>
        )}

        {/* Rating Overlay */}
        {salon.avg_rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-sm shadow-sm">
            <FiStar className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-gray-800">{salon.avg_rating}</span>
            {salon.total_ratings && (
              <span className="text-xs text-gray-500">({salon.total_ratings})</span>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={`/salon/${salon.slug}`} className="block p-4">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors mb-1 text-lg">
          {salon.name}
        </h3>

        {salon.tagline && (
          <p className="text-sm text-gray-500 mb-2 line-clamp-1">{salon.tagline}</p>
        )}

        <div className="flex items-center text-sm text-gray-500 mb-3">
          <FiMapPin className="w-3.5 h-3.5 mr-1.5 shrink-0 text-gray-400" />
          <span className="truncate">{salon.address}, {salon.city}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-500">
            <FiClock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {salon.opening_time?.slice(0, 5)} - {salon.closing_time?.slice(0, 5)}
          </div>
          {salon.starting_price && (
            <span className="text-sm font-bold text-brand-600">
              From ₹{Math.round(salon.starting_price)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-44 sm:h-48 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-100 rounded-lg w-3/4" />
        <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
        <div className="h-4 bg-gray-100 rounded-lg w-full" />
        <div className="h-px bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
          <div className="h-4 bg-gray-100 rounded-lg w-1/4" />
        </div>
      </div>
    </div>
  )
}

export default function Discover() {
  const [searchParams] = useSearchParams()
  const { getLocation } = useCustomer()
  const [salons, setSalons] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [activeCategory, setActiveCategory] = useState('')
  const [filter, setFilter] = useState({ type: '', sort: 'distance', radius: 10000 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchSalons()
  }, [filter, activeCategory])

  // Also fetch on initial mount if search param is present
  useEffect(() => {
    const initialSearch = searchParams.get('search')
    if (initialSearch) {
      setSearch(initialSearch)
      fetchSalons(initialSearch)
    }
  }, [])

  const fetchSalons = async (searchOverride) => {
    try {
      setLoading(true)
      const loc = await getLocation()
      const params = {
        lat: loc.lat, lng: loc.lng,
        radius: filter.radius,
        sort: filter.sort,
        limit: 50
      }
      if (filter.type) params.type = filter.type
      const searchVal = searchOverride !== undefined ? searchOverride : search
      if (searchVal) params.search = searchVal
      if (activeCategory) params.search = (params.search || '') + ' ' + activeCategory

      const res = await axios.get(`${API_URL}/salons/nearby`, { params })
      setSalons(res.data.salons)
    } catch (error) {
      console.error('Failed to fetch salons:', error)
      toast.error('Failed to load salons')
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = () => {
    toast('Favorites coming soon', { icon: '💫' })
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchSalons()
  }

  const activeFilterCount = [filter.type, filter.sort !== 'distance' ? filter.sort : ''].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceNavbar />

      {/* Search Header */}
      <header className="bg-white border-b border-gray-100 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search salons, services, or areas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition text-gray-700"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); fetchSalons('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3.5 bg-brand-gradient-r text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-600 transition-all shadow-md shadow-brand"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`relative p-3.5 border rounded-xl transition-all ${
                showFilters || activeFilterCount > 0
                  ? 'border-brand-300 bg-brand-50 text-brand-600'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <FiSliders className="w-5 h-5" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </form>

          {/* Service Category Chips - Horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
            {serviceCategories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(activeCategory === cat.value ? '' : cat.value)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                  activeCategory === cat.value
                    ? 'bg-brand-600 text-white shadow-brand'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-3 pt-3 pb-1 border-t border-gray-100">
                  {/* Salon Type */}
                  <div className="flex gap-1.5">
                    {salonTypes.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setFilter(f => ({ ...f, type: t.value }))}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                          filter.type === t.value
                            ? 'bg-brand-600 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={filter.sort}
                      onChange={(e) => setFilter(f => ({ ...f, sort: e.target.value }))}
                      className="appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-brand-400 cursor-pointer"
                    >
                      {sortOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>

                  {/* Radius */}
                  <div className="relative">
                    <select
                      value={filter.radius}
                      onChange={(e) => setFilter(f => ({ ...f, radius: parseInt(e.target.value) }))}
                      className="appearance-none pl-4 pr-10 py-2 rounded-full text-sm font-medium border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-brand-400 cursor-pointer"
                    >
                      <option value="2000">Within 2 km</option>
                      <option value="5000">Within 5 km</option>
                      <option value="10000">Within 10 km</option>
                      <option value="25000">Within 25 km</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Results */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-800">
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                Finding salons...
              </span>
            ) : (
              `${salons.length} salon${salons.length !== 1 ? 's' : ''} found`
            )}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : salons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <FiMapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">No salons found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Try increasing the search radius, changing your filters, or searching for a different term.
            </p>
            <button
              onClick={() => {
                setSearch('')
                setActiveCategory('')
                setFilter({ type: '', sort: 'distance', radius: 25000 })
              }}
              className="px-6 py-3 bg-brand-100 text-brand-700 rounded-xl font-semibold hover:bg-brand-200 transition"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence>
              {salons.map((salon) => (
                <SalonCard
                  key={salon.id}
                  salon={salon}
                  onFavorite={toggleFavorite}
                  isFavorite={false}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}
