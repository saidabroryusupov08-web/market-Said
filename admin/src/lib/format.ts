import { numericDateTime } from '../../../shared/dates'

// sana tanlangan til formatida
export const formatDateTime = (iso: string) => numericDateTime(new Date(iso))
