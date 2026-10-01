import { createI18n } from '../../../shared/i18n'
import en from './en'
import ru from './ru'
import uz from './uz'

// Admin panel matnlari. Yangi matn qo'shganda: avval ru.ts ga, keyin en.ts va uz.ts ga
// (TypeScript qaysi tilda kalit yetishmayotganini ko'rsatadi).
export const { I18nProvider, useT, tr } = createI18n({ ru, en, uz })
export type { Lang } from '../../../shared/i18n'
