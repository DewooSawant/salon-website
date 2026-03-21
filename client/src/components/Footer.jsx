import { FiInstagram, FiFacebook, FiTwitter, FiYoutube, FiHeart } from 'react-icons/fi'

const quickLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Services', href: '#services' },
  { name: 'Pricing', href: '#pricing' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Contact', href: '#contact' },
]

const services = [
  'Haircuts',
  'Beard Styling',
  'Hair Coloring',
  'Hair Spa',
  'Facial',
  'Head Massage',
]

const socialLinks = [
  { icon: FiInstagram, href: '#', label: 'Instagram' },
  { icon: FiFacebook, href: '#', label: 'Facebook' },
  { icon: FiTwitter, href: '#', label: 'Twitter' },
  { icon: FiYoutube, href: '#', label: 'YouTube' },
]

export default function Footer() {
  return (
    <footer className="relative bg-dark-900 border-t border-white/5">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <a href="#home" className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <span className="font-display text-2xl font-bold text-dark-950">G</span>
              </div>
              <div>
                <span className="block font-display text-xl font-semibold text-gradient">
                  Glamour Cuts
                </span>
                <span className="text-xs text-gray-500">Premium Salon</span>
              </div>
            </a>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Your premier destination for grooming excellence in Keshav Nagar, Pune. 
              Where style meets tradition.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-dark-800 border border-white/5 flex items-center justify-center text-gray-400 hover:text-gold-400 hover:border-gold-500/30 transition-all duration-300"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-gold-400 transition-colors text-sm"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-6">Services</h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <a
                    href="#services"
                    className="text-gray-400 hover:text-gold-400 transition-colors text-sm"
                  >
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contact Info</h3>
            <div className="space-y-4 text-sm">
              <p className="text-gray-400">
                <span className="block text-gold-400 mb-1">Address:</span>
                Shop No. 5, Keshav Park,<br />
                Keshav Nagar, Pune - 411036
              </p>
              <p className="text-gray-400">
                <span className="block text-gold-400 mb-1">Phone:</span>
                +91 98765 43210
              </p>
              <p className="text-gray-400">
                <span className="block text-gold-400 mb-1">Email:</span>
                hello@glamourcuts.in
              </p>
              <p className="text-gray-400">
                <span className="block text-gold-400 mb-1">Hours:</span>
                Mon - Sat: 10 AM - 9 PM
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} Glamour Cuts. All rights reserved.
            </p>
            <p className="flex items-center gap-1">
              Made with <FiHeart className="text-red-500" /> in Pune, India
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

