// Admin rasmi: yuklangan bo'lsa rasm, bo'lmasa ismning (yoki emailning) bosh harfi gradient fonda
function Avatar({
  src,
  name,
  className = 'size-8 text-xs',
}: {
  src: string | null
  name: string
  className?: string
}) {
  if (src) {
    return <img src={src} alt="" className={`shrink-0 rounded-full object-cover ${className}`} />
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-rose-600 font-semibold text-white uppercase ${className}`}
    >
      {name.trim().charAt(0) || 'A'}
    </span>
  )
}

export default Avatar
