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

const contacts = [
  { Icon: Mail, text: 'saidabroryusupov08@gmail.com', href: 'mailto:saidabroryusupov08@gmail.com' },
  { Icon: Phone, text: '+998 50 550 77 17', href: 'tel:+998505507717' },
]

const legalLinks = ['Политика конфиденциальности', 'Условия использования', 'Политика cookie']

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
              <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Введите email"
                  aria-label="Email"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-transparent bg-gray-100 px-3 text-sm outline-none transition focus:border-gray-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,0,0,0.08)]"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 cursor-pointer rounded-md bg-gray-950 px-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
                >
                  Подписаться
                </button>
              </form>
            )}

            <ul className="mt-5 flex flex-col gap-2">
              {contacts.map(({ Icon, text, href }) => (
                <li key={text}>
                  <a
                    href={href}
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
          <p className="text-gray-500">© 2026 StyleHub. Все права защищены.</p>
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
