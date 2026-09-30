import { useState, type FormEvent } from 'react'
import { Mail, Phone } from 'lucide-react'
import {
  InstagramIcon,
  LinkedinIcon,
  TelegramIcon,
  ThreadsIcon,
  TwitterIcon,
  WhatsappIcon,
  YoutubeIcon,
} from './SocialIcons'
import Logo from '../ui/Logo'
import { useCart } from '../../context/CartContext'
import { getClientInfo } from '../../utils/device'
import { validateEmail } from '../../utils/email'

const linkGroups = [
  {
    title: 'Магазин',
    links: [
      'Новинки',
      'Мужская коллекция',
      'Женская коллекция',
      'Детская коллекция',
      'Товары со скидкой',
      'Аксессуары',
    ],
  },
  {
    title: 'Обслуживание клиентов',
    links: [
      'Связаться с нами',
      'Таблица размеров',
      'Информация о доставке',
      'Возврат и обмен',
      'Частые вопросы',
      'Отследить заказ',
    ],
  },
]

const socials = [
  { label: 'Instagram', Icon: InstagramIcon, href: 'https://instagram.com/ksimov.19' },
  { label: 'Telegram', Icon: TelegramIcon, href: 'https://t.me/ksimov_hp' },
  {
    label: 'WhatsApp',
    Icon: WhatsappIcon,
    href: 'https://api.whatsapp.com/send?phone=998505507717',
  },
  { label: 'Threads', Icon: ThreadsIcon, href: 'https://www.threads.net/@ksimov.19' },
  { label: 'Twitter', Icon: TwitterIcon, href: 'https://twitter.com/ksimov_hp' },
  { label: 'YouTube', Icon: YoutubeIcon, href: 'https://youtube.com/@ksimov_hp' },
  {
    label: 'LinkedIn',
    Icon: LinkedinIcon,
    href: 'https://uz.linkedin.com/in/saidabror-yusupov-15533b425',
  },
]

const EMAIL = 'saidabroryusupov08@gmail.com'

// mailto: kompyuterda pochta dasturi sozlanmagan bo'lsa hech narsa qilmaydi,
// shuning uchun email yangi oynada Gmail'ning "yangi xat" oynasini ochadi
const contacts = [
  {
    Icon: Mail,
    text: EMAIL,
    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`,
    external: true,
  },
  { Icon: Phone, text: '+998 50 550 77 17', href: 'tel:+998505507717', external: false },
]

const legalLinks = ['Политика конфиденциальности', 'Условия использования', 'Политика cookie']

const linkClass = 'text-gray-500 transition hover:text-gray-950'

function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  // spam-botlar uchun tuzoq: odamga ko'rinmaydi, uni faqat avtomatik botlar to'ldiradi
  const [website, setWebsite] = useState('')
  const { items, total } = useCart()

  // email Vercel funksiyasi (api/subscribe.ts) orqali admin panel (Supabase) va Telegram botga yuboriladi
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    const problem = validateEmail(email)
    if (problem) return setError(problem)

    setSending(true)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          website,
          ...getClientInfo(),
          cart: items.map((item) => ({
            name: item.product.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            price: item.price,
          })),
          total,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSubscribed(true)
      setEmail('')
    } catch {
      // email o'chirilmaydi, foydalanuvchi qayta urinib ko'rishi mumkin
      setError('Не удалось отправить. Попробуйте позже.')
    } finally {
      setSending(false)
    }
  }

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto w-[90%] lg:w-[70%]">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.4fr] lg:gap-8">
          <div>
            <a href="#" aria-label="cX-shop — наверх" className="inline-block">
              <Logo />
            </a>
            <p className="mt-4 max-w-60 text-gray-500">
              Ваш магазин premium-моды и одежды. Качество и стиль в каждой
              вещи, которую мы предлагаем.
            </p>
            <div className="mt-4 grid w-fit grid-cols-4 gap-2">
              {socials.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
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
            <h3 className="text-lg font-medium text-gray-950">Будьте в курсе</h3>
            <p className="mt-4 text-gray-500">
              Подпишитесь, чтобы узнавать о новинках и эксклюзивных предложениях.
            </p>

            {subscribed ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-700">
                Спасибо за подписку!
              </p>
            ) : (
              // noValidate: brauzerning inglizcha xabari o'rniga o'zimizning tekshiruv ishlaydi
              // input alohida qatorda, to'liq kenglikda: uzun email ham to'liq ko'rinadi
              <form onSubmit={handleSubmit} noValidate className="relative mt-4">
                <input
                  type="text"
                  // "website" emas: brauzer avto-to'ldirishi haqiqiy odamni bot deb qo'ymasligi uchun
                  name="cx_hp_field"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute -left-[9999px] size-px opacity-0"
                />
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    placeholder="Введите email"
                    aria-label="Email"
                    aria-invalid={!!error}
                    aria-describedby={error ? 'subscribe-error' : undefined}
                    className={`h-12 w-full rounded-lg border bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:shadow-[0_0_0_4px_rgba(59,130,246,0.25)] ${
                      error
                        ? 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'
                        : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="submit"
                    aria-disabled={sending}
                    className={`h-11 w-full rounded-lg px-3.5 text-sm font-semibold text-white transition ${
                      sending
                        ? 'cursor-not-allowed bg-gray-500'
                        : 'cursor-pointer bg-gray-950 hover:bg-gray-800'
                    }`}
                  >
                    {sending ? 'Отправка...' : 'Подписаться'}
                  </button>
                </div>
                {error && (
                  <p id="subscribe-error" role="alert" className="mt-2 text-xs text-red-600">
                    {error}
                  </p>
                )}
              </form>
            )}

            <ul className="mt-5 flex flex-col gap-2">
              {contacts.map(({ Icon, text, href, external }) => (
                <li key={text}>
                  <a
                    href={href}
                    {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
                    className="flex items-center gap-2.5 text-gray-500 transition hover:text-gray-950"
                  >
                    <Icon className="size-4 shrink-0" />
                    {text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-gray-200 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-gray-500">© 2026 cX-shop. Все права защищены.</p>
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
