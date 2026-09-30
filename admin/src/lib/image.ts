// Rasm yuklashdan oldin kichraytiriladi (tezroq ochiladi, Storage joyi tejaladi).
// square: markazdan kvadrat qilib kesiladi (profil rasmi uchun).
export function resizeImage(file: File, maxSize = 1000, square = false): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const sx = square ? (img.width - side) / 2 : 0
      const sy = square ? (img.height - side) / 2 : 0
      const sw = square ? side : img.width
      const sh = square ? side : img.height
      const scale = Math.min(1, maxSize / Math.max(sw, sh))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(sw * scale)
      canvas.height = Math.round(sh * scale)
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Не удалось прочитать изображение'))
    }
    img.src = url
  })
}
