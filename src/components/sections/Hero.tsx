import heroImg from '../../assets/hero-store.png'

function scrollToProducts() {
  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
}

function Hero() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto grid w-[90%] items-center gap-12 lg:w-[70%] lg:grid-cols-2 lg:gap-16">
        <div>
          <h1 className="text-4xl leading-tight font-normal text-gray-950 sm:text-5xl lg:text-6xl">
            Новая коллекция «Лето 2026»
          </h1>
          <p className="mt-6 max-w-[460px] text-lg leading-relaxed text-gray-500">
            Откройте для себя последние тенденции моды в нашей подборке
            premium-одежды. Качество и стиль в каждой вещи.
          </p>

          <div className="mt-6 flex flex-wrap gap-4">
            <button
              type="button"
              onClick={scrollToProducts}
              className="rounded-md bg-gray-950 px-[21.5px] py-[7.5px] font-semibold text-white transition hover:bg-gray-800"
            >
              Перейти к покупкам
            </button>
            <button
              type="button"
              onClick={scrollToProducts}
              className="rounded-md border border-gray-200 bg-white px-[21.5px] py-[7.5px] font-semibold text-gray-950 transition hover:bg-gray-100"
            >
              Смотреть каталог
            </button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-8 text-sm text-gray-500">
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-green-500" />
              Бесплатная доставка
            </li>
            <li className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              Возврат в течение 30 дней
            </li>
          </ul>
        </div>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200 lg:-ml-[20px] lg:w-[calc(100%+20px)]">
          {/* "New" va "50% Off" belgilari rasmning o'zida bor */}
          <img
            src={heroImg}
            alt="Интерьер магазина одежды StyleHub"
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
