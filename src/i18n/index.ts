import { createI18n } from '../../shared/i18n'
import en from './en'
import ru from './ru'
import uz from './uz'

// Do'kon matnlari. Yangi matn qo'shganda: avval ru.ts ga, keyin en.ts va uz.ts ga
// (TypeScript qaysi tilda kalit yetishmayotganini ko'rsatadi).
// Mahsulot nomlari va tavsiflari tarjima qilinmaydi (admin kiritgan matn); kategoriya,
// rang va o'lchamlar shared/dataLabels.ts orqali ko'rsatiladi.
export const { I18nProvider, useT, tr } = createI18n({ ru, en, uz })
