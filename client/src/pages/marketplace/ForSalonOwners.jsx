import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiArrowRight, FiPhone, FiPlay } from 'react-icons/fi'
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
    emoji: '💰', title: 'Full POS Billing',
    titleMr: 'पूर्ण POS बिलिंग',
    desc: 'Full walk-in billing page — select services by category, assign stylist, apply discount, choose payment method.',
    descMr: 'पूर्ण वॉक-इन बिलिंग — कॅटेगरीनुसार सर्व्हिस निवडा, स्टायलिस्ट असाइन करा, डिस्काउंट द्या.',
    color: 'from-green-600 to-teal-600',
    screenshot: '/screenshots/billing.png',
    highlights: ['Service grid by category', 'Stylist assignment', 'Discount & payment method'],
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
]

const testimonials = [
  { name: 'Bhakti Sawant', salon: 'Bhakti Salon, Pune', text: 'Walk-in billing saved me so much time. Earlier I was writing everything on paper. Now I track revenue, customers, staff - everything on Stylo.', avatar: 'भ' },
  { name: 'Fredo', salon: 'Fredo Salon, Pune', text: 'My repeat customers increased after I started sending WhatsApp receipts. Customers feel professional service.', avatar: 'F' },
]

const faqs = [
  { q: 'Is it really free?', qMr: 'खरंच मोफत आहे का?', a: 'Yes! Walk-in billing, CRM, analytics, staff management — all free. No hidden charges.' },
  { q: 'Do I need a computer?', qMr: 'कंप्युटर लागतो का?', a: 'No! Works on your phone. Just open stylo.sbs in your mobile browser.' },
  { q: 'How long to set up?', qMr: 'सेटअप किती वेळ लागतो?', a: '2 minutes. Register, add your services, start billing. We can help you set up for free.' },
  { q: 'Is my data safe?', qMr: 'माझा डेटा सुरक्षित आहे का?', a: 'Yes. Your data is encrypted and stored securely. Only you can see your salon data.' },
]

const anim = { initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } }

export default function ForSalonOwners() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 sm:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex gap-2">
          <Link to="/salon-owner/register" className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold text-center">
            Register Free
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
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-600 to-accent-500 flex items-center justify-center">
              <span className="text-white text-sm">✂️</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-brand-700 to-accent-600 bg-clip-text text-transparent">Stylo</span>
          </Link>
          <div className="flex items-center gap-2">
            <a href={`tel:${PHONE}`} className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 font-medium">
              <FiPhone className="w-4 h-4" /> {PHONE}
            </a>
            <Link to="/salon-owner/register" className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold">
              Register Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-5xl mx-auto px-4 pt-12 pb-16 sm:pt-16 sm:pb-20 text-center">
          <motion.div {...anim} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
            💈 पुण्यातील सलून मालकांसाठी
          </motion.div>
          <motion.h1 {...anim} transition={{ delay: 0.05 }} className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            तुमचा सलून
            <br />
            <span className="bg-white/20 px-3 py-1 rounded-xl inline-block mt-2">Stylo</span> वर आणा
          </motion.h1>
          <motion.p {...anim} transition={{ delay: 0.1 }} className="text-base sm:text-lg text-white/85 max-w-xl mx-auto mb-8 leading-relaxed">
            Walk-in billing, customer tracking, staff management, analytics — सगळं एकाच ॲपमध्ये. <strong>मोफत.</strong>
          </motion.p>
          <motion.div {...anim} transition={{ delay: 0.15 }} className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/salon-owner/register" className="w-full sm:w-auto px-8 py-4 bg-white text-brand-700 rounded-2xl text-lg font-bold shadow-xl hover:bg-gray-100 transition text-center">
              Register Your Salon Free <FiArrowRight className="inline w-5 h-5 ml-1" />
            </Link>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="w-full sm:w-auto px-8 py-4 bg-green-500 text-white rounded-2xl text-lg font-bold shadow-xl hover:bg-green-600 transition flex items-center justify-center gap-2">
              <FaWhatsapp className="w-5 h-5" /> WhatsApp Us
            </a>
          </motion.div>
          <motion.p {...anim} transition={{ delay: 0.2 }} className="text-sm text-white/60 mt-4">
            No credit card needed • Setup in 2 minutes • Works on mobile
          </motion.p>
        </div>
      </section>

      {/* Pain Points */}
      <section className="py-12 sm:py-16 px-4 bg-red-50">
        <div className="max-w-5xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            😰 अजूनही असं मॅनेज करताय?
          </motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {painPoints.map((p, i) => (
              <motion.div key={i} {...anim} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-4 text-center border border-red-100 shadow-sm">
                <div className="text-3xl mb-2">{p.emoji}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{p.title}</h3>
                <p className="text-xs text-gray-500">{p.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Alternating Layout */}
      <section className="py-12 sm:py-16 px-4">
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
              <motion.div key={i} {...anim} transition={{ delay: 0.05 }}
                className={`flex flex-col ${i % 2 ? 'sm:flex-row-reverse' : 'sm:flex-row'} gap-6 items-center`}>
                {/* Info */}
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
                {/* Screenshot */}
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
      <section className="py-12 sm:py-16 px-4 bg-brand-50">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            किंमत किती?
          </motion.h2>
          <motion.div {...anim} className="bg-gradient-to-br from-brand-600 to-accent-500 rounded-3xl p-8 text-white shadow-xl mt-6">
            <div className="text-6xl font-black mb-2">FREE</div>
            <p className="text-lg text-white/90 mb-6">मोफत. कोणताही हिडन चार्ज नाही.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left max-w-md mx-auto">
              {['Unlimited Walk-in Bills', 'Customer CRM', 'Analytics & Reports', 'Staff Management', 'Online Booking', 'WhatsApp Receipts'].map(f => (
                <div key={f} className="flex items-center gap-1.5 text-sm">
                  <FiCheck className="w-4 h-4 text-green-300 shrink-0" /> {f}
                </div>
              ))}
            </div>
            <Link to="/salon-owner/register" className="inline-block mt-8 px-8 py-4 bg-white text-brand-700 rounded-2xl text-lg font-bold shadow-lg hover:bg-gray-100 transition">
              Register Your Salon Free →
            </Link>
          </motion.div>
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
              <motion.div key={i} {...anim} transition={{ delay: i * 0.1 }}
                className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
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
              <motion.div key={i} {...anim} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 text-center border border-gray-100 shadow-sm">
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
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...anim} className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8">
            सामान्य प्रश्न
          </motion.h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <motion.div key={i} {...anim} transition={{ delay: i * 0.05 }}
                className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm mb-1">{f.qMr} / {f.q}</h3>
                <p className="text-sm text-gray-600">{f.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 sm:py-16 px-4 bg-gradient-to-br from-brand-600 to-accent-500 text-white">
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
          <p className="text-gray-400 text-sm mb-2">Book. Style. Shine.</p>
          <p className="text-gray-500 text-xs">Made with ❤️ in Pune, India</p>
        </div>
      </footer>

      {/* Bottom spacer for mobile sticky CTA */}
      <div className="h-20 sm:hidden" />
    </div>
  )
}
