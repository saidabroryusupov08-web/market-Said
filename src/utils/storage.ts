// localStorage bilan xavfsiz ishlash: private rejimda yoki bloklanganda xato bermaydi

export function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// false qaytsa saqlanmadi (masalan xotira to'lgan) — kerak joyda foydalanuvchiga aytiladi
export function saveToStorage(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    // saqlab bo'lmasa, sayt baribir ishlashda davom etadi
    return false
  }
}
