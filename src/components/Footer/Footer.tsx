import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { FacebookIcon, InstagramIcon, TwitterIcon, YoutubeIcon } from './SocialIcons' 

const linkGroups = [
  {
    title: 'Shop',
    links: [
      'New Arrivals',
      "Men's Collection",
      "Women's Collection",
      'Kids Collection',
      'Sale Items',
      'Accessories',
    ],
  },
  {
    title: 'Customer Service',
    links: [
      'Contact Us',
      'Size Guide',
      'Shipping Info',
      'Returns & Exchanges',
      'FAQ',
      'Track Your Order',
    ],
  },
]

const socials = [
  { label: 'Facebook', Icon: FacebookIcon },
  { label: 'Instagram', Icon: InstagramIcon },
  { label: 'Twitter', Icon: TwitterIcon },
  { label: 'YouTube', Icon: YoutubeIcon },
]

const contacts = [
  { Icon: Mail, text: 'info@stylehub.com' },
  { Icon: Phone, text: '1-800-FASHION' },
  { Icon: MapPin, text: '123 Fashion Ave, NY 10001' },
]

const legalLinks = ['Privacy Policy', 'Terms of Service', 'Cookie Policy']

const linkClass = 'text-gray-500 transition hover:text-gray-950'

function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto w-[90%] lg:w-[70%]">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <a href="#" className="text-xl font-semibold text-gray-950">
              StyleHub
            </a>
            <p className="mt-4 max-w-60 text-gray-500">
              Your destination for premium fashion and apparel. Quality meets
              style in every piece we offer.
            </p>
            <div className="mt-4 flex gap-2">
              {socials.map(({ label, Icon }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="rounded-md p-2 text-gray-800 transition hover:bg-gray-200 hover:text-black"
                >
                  <Icon className="size-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {linkGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-medium text-gray-950">{group.title}</h3>
              <ul className="mt-4 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link}>
                    <a href="#" className={linkClass}>
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="text-lg font-medium text-gray-950">Stay Updated</h3>
            <p className="mt-4 text-gray-500">
              Subscribe to get updates on new arrivals and exclusive offers.
            </p>

            {subscribed ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
                Thanks for subscribing!
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-gray-100 px-3 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 cursor-pointer rounded-md bg-gray-950 px-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Subscribe
                </button>
              </form>
            )}

            <ul className="mt-5 flex flex-col gap-2">
              {contacts.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-gray-500">
                  <Icon className="size-4 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500">© 2024 StyleHub. All rights reserved.</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((link) => (
              <li key={link}>
                <a href="#" className={linkClass}>
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}

export default Footer
