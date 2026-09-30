// obuna xabari uchun: foydalanuvchi qaysi qurilma va brauzerdan kirgani

function detectDevice(ua: string): string {
  if (/android/i.test(ua)) return 'Android'
  if (/iphone|ipod/i.test(ua)) return 'iPhone'
  // yangi iPad'lar o'zini Mac deb ko'rsatadi, sensorli ekran orqali ajratiladi
  if (/ipad/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad'
  if (/windows/i.test(ua)) return 'Windows'
  if (/macintosh|mac os x/i.test(ua)) return 'macOS'
  if (/cros/i.test(ua)) return 'ChromeOS'
  if (/linux/i.test(ua)) return 'Linux'
  return 'Неизвестно'
}

// tartib muhim: Edge, Yandex va Opera ham o'zini "Chrome" deb yozadi
function detectBrowser(ua: string): string {
  if (/edg(e|a|ios)?\//i.test(ua)) return 'Edge'
  if (/yabrowser/i.test(ua)) return 'Yandex'
  if (/opr\/|opera/i.test(ua)) return 'Opera'
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet'
  if (/firefox|fxios/i.test(ua)) return 'Firefox'
  if (/chrome|crios/i.test(ua)) return 'Chrome'
  if (/safari/i.test(ua)) return 'Safari'
  return 'Неизвестно'
}

export function getClientInfo() {
  const ua = navigator.userAgent
  return {
    device: detectDevice(ua),
    browser: detectBrowser(ua),
    language: navigator.language,
    screen: `${window.screen.width}×${window.screen.height}`,
  }
}
