import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiArrowRight, FiPhone, FiCalendar, FiChevronRight } from 'react-icons/fi'
import { FaWhatsapp } from 'react-icons/fa'

const PHONE = '7249838616'
const WA_LINK = `https://wa.me/91${PHONE}?text=${encodeURIComponent('Hi! I want to register my salon on Stylo. Please help me set up.')}`

const painPoints = [
  { emoji: '📝', title: 'कागदावर बिल लिहिताय?', titleEn: 'Writing bills on paper?', desc: 'No records, no history, no tracking' },
  { emoji: '😰', title: 'कस्टमर परत येत नाहीत?', titleEn: 'Customers not returning?', desc: 'No reminders, no follow-up' },
  { emoji: '🤷', title: 'किती कमाई झाली माहीत नाही?', titleEn: "Don't know today's revenue?", desc: 'No daily report, no analytics' },
  { emoji: '💸', title: 'स्टाफचा हिशोब लागत नाही?', titleEn: "Can't track staff earnings?", desc: 'No commission tracking, no salary slips' },
]

const features = [
  {
    emoji: '💰', title: 'Walk-in Billing',
    titleMr: '३ टॅपमध्ये बिल',
    desc: 'Customer came? Tap services, name, bill. Done in 5 seconds. Cash, UPI, Card - all tracked.',
    descMr: 'कस्टमर आला? सर्व्हिस टॅप करा, नाव टाका, बिल तयार. ५ सेकंदात. कॅश, UPI, कार्ड - सगळं ट्रॅक.',
    color: 'from-green-500 to-emerald-600',
    screenshot: '/screenshots/dashboard.png',
    highlights: ['Auto-suggests returning customers', 'WhatsApp receipt in 1 tap', 'Stylist tracking per bill'],
  },
  {
    emoji: '📊', title: 'Analytics & Reports',
    titleMr: 'रेव्हेन्यू रिपोर्ट',
    desc: 'Daily, weekly, monthly revenue. Top services, peak hours, payment breakdown. Know your business inside out.',
    descMr: 'दररोज, आठवडा, महिन्याचा रेव्हेन्यू. टॉप सर्व्हिसेस, पीक अवर्स, पेमेंट ब्रेकडाउन.',
    color: 'from-purple-500 to-violet-600',
    screenshot: '/screenshots/analytics.png',
    highlights: ['Revenue graphs', 'Stylist performance', 'Walk-in vs Online split'],
  },
  {
    emoji: '📋', title: 'Daily Register',
    titleMr: 'डेली रजिस्टर',
    desc: 'Complete daily report — revenue, bookings, payment breakdown, popular services, stylist performance, insights.',
    descMr: 'संपूर्ण दैनिक रिपोर्ट — रेव्हेन्यू, बुकिंग्स, पेमेंट, पॉप्युलर सर्व्हिसेस, स्टायलिस्ट परफॉर्मन्स.',
    color: 'from-blue-500 to-indigo-600',
    screenshot: '/screenshots/daily-register.png',
    highlights: ['Payment breakdown (Cash/UPI/Card)', 'Popular services ranking', 'Avg bill value & peak hours'],
  },
  {
    emoji: '✂️', title: 'Service Management',
    titleMr: 'सर्व्हिस मॅनेजमेंट',
    desc: 'Add all your services with prices, duration, categories. Mark popular services. Manage everything easily.',
    descMr: 'तुमच्या सगळ्या सर्व्हिसेस किमती, वेळ, कॅटेगरीसह ॲड करा. पॉप्युलर मार्क करा.',
    color: 'from-amber-500 to-orange-600',
    screenshot: '/screenshots/services.png',
    highlights: ['Categories (Haircut, Beard, Facial...)', 'Discounted pricing', 'Duration tracking'],
  },
  {
    emoji: '📅', title: 'Online Booking',
    titleMr: 'ऑनलाइन बुकिंग',
    desc: 'Your own salon page. Customers book 24/7. You get instant notification. No more missed calls.',
    descMr: 'तुमचं स्वतःचं सलून पेज. कस्टमर २४/७ बुक करतात. तुम्हाला लगेच नोटिफिकेशन.',
    color: 'from-pink-500 to-rose-600',
    screenshot: '/screenshots/quick-billing.png',
    highlights: ['Your salon page (stylo.sbs/your-salon)', 'Instant notification', 'Auto-confirm bookings'],
  },
  {
    emoji: '💪', title: 'Staff Pay',
    titleMr: 'स्टाफ पगार व्यवस्थापन',
    desc: 'Set salary, commission %. Auto-calculate monthly pay. Generate salary slips. Track per stylist revenue.',
    descMr: 'पगार, कमिशन % सेट करा. मासिक पे ऑटो कॅल्क्युलेट. सॅलरी स्लिप बनवा.',
    color: 'from-amber-500 to-orange-600',
    screenshot: '/screenshots/staff-pay.png',
    highlights: ['Salary + Commission tracking', 'Monthly payment records', 'Printable salary slips'],
  },
]

const testimonials = [
  { name: 'Bhakti Sawant', salon: 'Bhakti Salon, Pune', text: 'Walk-in billing saved me so much time. Earlier I was writing everything on paper. Now I track revenue, customers, staff — everything on Stylo.', avatar: 'भ' },
  { name: 'Fredo', salon: 'Fredo Salon, Pune', text: 'My repeat customers increased after I started sending WhatsApp receipts. Customers feel professional service.', avatar: 'F' },
]

const faqs = [
  { q: 'Is it really free?', qMr: 'खरंच मोफत आहे का?', a: 'Yes! Walk-in billing, CRM, analytics, staff management — all free. No hidden charges.' },
  { q: 'Do I need a computer?', qMr: 'कंप्युटर लागतो का?', a: 'No! Works on your phone. Just open stylo.sbs in your mobile browser.' },
  { q: 'How long to set up?', qMr: 'सेटअप किती वेळ लागतो?', a: '2 minutes. Register, add your services, start billing. We can help you set up for free.' },
  { q: 'Is my data safe?', qMr: 'माझा डेटा सुरक्षित आहे का?', a: 'Yes. Your data is encrypted and stored securely. Only you can see your salon data.' },
]

const anim = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function Landing() {
  const isSalonOwner = typeof window !== 'undefined' && !!localStorage.getItem('salonOwnerToken')
  const [recentBookings, setRecentBookings] = useState([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('stylo_recent_bookings')
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return
      // Keep only non-expired-looking entries (saved in last 90 days)
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
      setRecentBookings(parsed.filter(b => b.saved_at && b.saved_at > cutoff).slice(0, 3))
    } catch {}
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          <Link
            to={isSalonOwner ? '/salon-owner/dashboard' : '/salon-owner/register'}
            className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold text-center"
          >
            {isSalonOwner ? 'My Dashboard' : 'Register Free'}
          </Link>
          <a href={WA_LINK} target="_blank" rel="noreferrer" className="py-3 px-4 bg-green-500 text-white rounded-xl font-bold flex items-center gap-1.5">
            <FaWhatsapp className="w-5 h-5" />
          </a>
          <a href={`tel:${PHONE}`} className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold flex items-center gap-1.5">
            <FiPhone className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Nav */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center shadow-md shadow-brand-500/20">
              <span className="text-white text-sm">✂️</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Stylo</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-brand-700 transition">Features</a>
            <a href="#pricing" className="hover:text-brand-700 transition">Pricing</a>
            <a href="#faq" className="hover:text-brand-700 transition">FAQ</a>
            <a href="#contact" className="hover:text-brand-700 transition">Contact</a>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isSalonOwner ? (
              <Link to="/salon-owner/dashboard" className="px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/salon-owner/login" className="px-3 py-2 text-gray-700 rounded-xl text-sm font-semibold hover:text-brand-700 hover:bg-gray-50 transition">
                  Login
                </Link>
                <Link to="/salon-owner/register" className="px-3 sm:px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero — light bg, screenshot on right */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/60 via-white to-white">
        {/* Decorative glows */}
        <div className="pointer-events-none absolute -top-24 -right-16 w-96 h-96 bg-brand-200/40 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-20 w-80 h-80 bg-accent-200/40 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 pt-12 pb-16 sm:pt-20 sm:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* Left: copy */}
            <div className="text-center lg:text-left">
              <motion.div {...anim} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100/80 border border-brand-200 text-sm font-semibold text-brand-700 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Free for salon owners in Pune
              </motion.div>

              <motion.h1 {...anim} transition={{ delay: 0.05 }} className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 mb-5 leading-[1.05] tracking-tight">
                Run your salon.
                <br />
                <span className="bg-gradient-to-r from-brand-600 to-accent-500 bg-clip-text text-transparent">Not spreadsheets.</span>
              </motion.h1>

              <motion.p {...anim} transition={{ delay: 0.1 }} className="text-lg text-gray-600 mb-4 leading-relaxed max-w-xl mx-auto lg:mx-0">
                Walk-in billing, customer tracking, staff pay, analytics — all in one place. Built for Indian salons.
              </motion.p>
              <motion.p {...anim} transition={{ delay: 0.13 }} className="text-base text-gray-500 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
                सगळं एकाच ॲपमध्ये. <strong className="text-gray-700">मोफत.</strong>
              </motion.p>

              <motion.div {...anim} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-3 mb-5">
                <Link
                  to={isSalonOwner ? '/salon-owner/dashboard' : '/salon-owner/register'}
                  className="w-full sm:w-auto px-7 py-4 bg-brand-600 text-white rounded-xl text-base font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 hover:shadow-xl hover:shadow-brand-500/40 transition-all text-center"
                >
                  {isSalonOwner ? 'Go to My Dashboard' : 'Register Free'} <FiArrowRight className="inline w-4 h-4 ml-1.5" />
                </Link>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-4 bg-white text-gray-700 border border-gray-200 rounded-xl text-base font-semibold hover:border-green-400 hover:text-green-600 transition flex items-center justify-center gap-2"
                >
                  <FaWhatsapp className="w-5 h-5 text-green-500" /> WhatsApp Us
                </a>
              </motion.div>

              <motion.p {...anim} transition={{ delay: 0.2 }} className="text-sm text-gray-500">
                No credit card needed • Setup in 2 minutes • Works on mobile
              </motion.p>
            </div>

            {/* Right: product screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative mx-auto w-full max-w-lg lg:max-w-none"
            >
              <div className="absolute -inset-6 bg-gradient-to-br from-brand-400/20 via-accent-400/20 to-brand-400/20 rounded-3xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-brand-600 to-accent-500 rounded-2xl p-2 shadow-2xl shadow-brand-500/20">
                <div className="bg-gray-900 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span className="text-[10px] text-gray-500 ml-2">stylo.sbs/salon-owner/dashboard</span>
                  </div>
                  <img src="/screenshots/dashboard.png" alt="Stylo dashboard preview" className="w-full" loading="eager" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-500">
          <span className="font-semibold text-gray-700">💈 Made for salons in Pune</span>
          <span className="hidden sm:inline">•</span>
          <span>Walk-in billing in 5 seconds</span>
          <span className="hidden sm:inline">•</span>
          <span>Works fully on mobile</span>
          <span className="hidden sm:inline">•</span>
          <a href={`tel:${PHONE}`} className="text-brand-700 font-semibold hover:underline">Call {PHONE}</a>
        </div>
      </section>

      {/* Recent bookings on this device (customer-facing) */}
      {recentBookings.length > 0 && (
        <section className="bg-white border-b border-gray-100">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FiCalendar className="w-4 h-4 text-brand-600" /> Your recent bookings
              </h3>
              <span className="text-xs text-gray-400">on this device</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {recentBookings.map(b => (
                <Link
                  key={b.code}
                  to={`/booking/${b.code}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50 hover:bg-brand-50 rounded-xl border border-gray-100 hover:border-brand-200 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{b.salon_name}</p>
                    <p className="text-xs text-gray-500">{b.booking_date} · {b.start_time}</p>
                  </div>
                  <FiChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pain Points */}
      <section className="py-12 sm:py-16 px-4 bg-red-50">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            😰 अजूनही असं मॅनेज करताय?
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {painPoints.map((p, i) => (
              <motion.div
                key={i}
                {...anim}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-4 text-center border border-red-100 shadow-sm"
              >
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-12 sm:py-16 px-4 scroll-mt-16">
        <div className="max-w-5xl mx-auto">
          <motion.div {...anim} className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-brand-50 text-brand-600 text-sm font-bold mb-3">
              ✨ FEATURES
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Stylo तुमच्या सलूनसाठी काय करतो
            </h2>
          </motion.div>

          <div className="space-y-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                {...anim}
                transition={{ delay: 0.05 }}
                className={`flex flex-col ${i % 2 ? 'sm:flex-row-reverse' : 'sm:flex-row'} gap-6 items-center`}
              >
                <div className="flex-1">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r ${f.color} text-white text-sm font-bold mb-3`}>
                    {f.emoji} {f.title}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{f.titleMr}</h3>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">{f.desc}</p>
                  <p className="text-gray-500 text-xs mb-3 leading-relaxed">{f.descMr}</p>
                  <ul className="space-y-1.5">
                    {f.highlights.map((h, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                        <FiCheck className="w-4 h-4 text-green-500 shrink-0" /> {h}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 w-full">
                  <div className={`bg-gradient-to-br ${f.color} rounded-2xl p-2 shadow-xl`}>
                    <div className="bg-gray-900 rounded-xl overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-800">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        <span className="text-[10px] text-gray-500 ml-2">stylo.sbs</span>
                      </div>
                      {f.screenshot && (
                        <img src={f.screenshot} alt={f.title} className="w-full" loading="lazy" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-12 sm:py-16 px-4 bg-brand-50 scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-2">
            किंमत किती? / Pricing
          </motion.h2>
          <motion.p {...anim} className="text-center text-gray-500 mb-8">पूर्ण transparent. कोणताही hidden charge नाही.</motion.p>

          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div {...anim} className="bg-white rounded-2xl border-2 border-green-200 p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">CURRENT</div>
              <div className="text-3xl mb-1">🎉</div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Free Plan</h3>
              <p className="text-gray-500 text-sm mb-4">आत्ता आणि कायमचं मोफत</p>
              <div className="text-4xl font-black text-green-600 mb-4">₹0<span className="text-base font-normal text-gray-400">/month</span></div>
              <ul className="space-y-2 mb-6">
                {['Unlimited Walk-in Billing', 'Customer CRM & History', 'Analytics & Daily Reports', 'Staff Salary & Commission', 'Online Booking Page', 'WhatsApp Receipts', 'Stylist Performance Tracking'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCheck className="w-4 h-4 text-green-500 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/salon-owner/register" className="block w-full py-3 bg-green-600 text-white rounded-xl text-center font-bold hover:bg-green-700 transition">
                Register Free →
              </Link>
            </motion.div>

            <motion.div {...anim} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-6 relative overflow-hidden opacity-90">
              <div className="absolute top-3 right-3 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-bold">COMING SOON</div>
              <div className="text-3xl mb-1">🚀</div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Pro Plan</h3>
              <p className="text-gray-500 text-sm mb-4">Advanced features for growing salons</p>
              <div className="text-4xl font-black text-brand-600 mb-4">Coming Soon</div>
              <ul className="space-y-2 mb-6">
                {['Everything in Free, plus:', 'SMS & WhatsApp Reminders', 'Loyalty Points & Rewards', 'Membership Plans', 'Inventory Management', 'Priority Support', 'Custom Branding'].map((f, i) => (
                  <li key={f} className={`flex items-center gap-2 text-sm ${i === 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                    {i === 0 ? '✨' : <FiCheck className="w-4 h-4 text-brand-400 shrink-0" />} {f}
                  </li>
                ))}
              </ul>
              <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-center font-bold">
                Coming Soon
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            सलून मालक काय म्हणतात
          </motion.h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                {...anim}
                transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100"
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
                <p className="text-gray-700 text-sm mb-4 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">{t.avatar}</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.salon}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="py-12 sm:py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            🚀 फक्त ३ स्टेप्समध्ये सुरू करा
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { num: '1', title: 'Register करा', desc: 'stylo.sbs वर जा, तुमचं नाव आणि फोन नंबर टाका. फक्त २ मिनिटं.', emoji: '📱' },
              { num: '2', title: 'Services ॲड करा', desc: 'तुमच्या सर्व्हिसेस, किमती, आणि स्टाफ मेंबर्स ॲड करा.', emoji: '✂️' },
              { num: '3', title: 'Billing सुरू करा', desc: 'आजच walk-in billing वापरायला सुरू करा. तुमचं पेज कस्टमर्सना शेअर करा!', emoji: '💰' },
            ].map((s, i) => (
              <motion.div
                key={i}
                {...anim}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm"
              >
                <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-3">{s.num}</div>
                <div className="text-2xl mb-2">{s.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-12 sm:py-16 px-4 scroll-mt-16">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            सामान्य प्रश्न
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <motion.div
                key={i}
                {...anim}
                transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100"
              >
                <h3 className="font-bold text-gray-900 text-sm mb-1">{f.qMr} / {f.q}</h3>
                <p className="text-sm text-gray-600">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA / Contact */}
      <section id="contact" className="py-12 sm:py-16 px-4 bg-gradient-to-br from-brand-600 to-accent-500 text-white scroll-mt-16">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">आजच सुरू करा — मोफत!</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">Register करा, services ॲड करा, आणि walk-in billing सुरू करा. आम्ही तुम्हाला सेटअप करायला मदत करू.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/salon-owner/register" className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 rounded-2xl text-lg font-bold shadow-xl">
              Register Free →
            </Link>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-green-500 text-white rounded-2xl text-lg font-bold shadow-xl flex items-center justify-center gap-2">
              <FaWhatsapp className="w-5 h-5" /> WhatsApp वर संपर्क करा
            </a>
            <a href={`tel:${PHONE}`} className="w-full sm:w-auto px-8 py-4 border-2 border-white/30 text-white rounded-2xl text-lg font-bold flex items-center justify-center gap-2">
              <FiPhone className="w-5 h-5" /> Call: {PHONE}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-sm">✂️</div>
            <span className="text-lg font-bold">Stylo</span>
          </div>
          <p className="text-gray-400 text-sm mb-2">Salon management, simplified.</p>
          <p className="text-gray-500 text-xs">Made with ❤️ in Pune, India</p>
        </div>
      </footer>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-20 sm:hidden" />
    </div>
  )
}
