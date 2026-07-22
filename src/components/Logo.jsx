// شعار احترافي لأسرة السَّروجيُّ — طاجن أنيق داخل شارة بحلقة ذهبية مزدوجة
export default function Logo({ size = 96, rounded = true }) {
  const id = 'lg' + size
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="شعار أسرة السروجي">
      <defs>
        <linearGradient id={`${id}-bg`} x1="12" y1="6" x2="84" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#a1493a" />
          <stop offset="0.55" stopColor="#7c342a" />
          <stop offset="1" stopColor="#5f2820" />
        </linearGradient>
        <linearGradient id={`${id}-gold`} x1="20" y1="18" x2="76" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4d891" />
          <stop offset="0.5" stopColor="#d4a24e" />
          <stop offset="1" stopColor="#a9762b" />
        </linearGradient>
        <linearGradient id={`${id}-pot`} x1="30" y1="32" x2="62" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#efdcd2" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.4" r="0.62">
          <stop stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* الشارة */}
      <rect x="2" y="2" width="92" height="92" rx={rounded ? 24 : 0} fill={`url(#${id}-bg)`} />
      <rect x="2" y="2" width="92" height="92" rx={rounded ? 24 : 0} fill={`url(#${id}-glow)`} />

      {/* الحلقة الذهبية المزدوجة */}
      <circle cx="48" cy="48" r="37" stroke={`url(#${id}-gold)`} strokeWidth="2.4" />
      <circle cx="48" cy="48" r="32.5" stroke={`url(#${id}-gold)`} strokeWidth="1" strokeOpacity="0.5" />

      {/* بخار */}
      <g stroke={`url(#${id}-gold)`} strokeWidth="2.3" strokeLinecap="round" opacity="0.85">
        <path d="M42 25.5c-2.6-2.6 2.6-4.4 0-7" />
        <path d="M48 23.5c-2.6-2.6 2.6-4.4 0-7" />
        <path d="M54 25.5c-2.6-2.6 2.6-4.4 0-7" />
      </g>

      {/* غطاء الطاجن المخروطي */}
      <path d="M34 62C34 45 40 34 48 34S62 45 62 62Z" fill={`url(#${id}-pot)`} />
      {/* لمعة على الغطاء */}
      <path d="M41.5 58C41.5 47.5 43.8 40 47 37.5" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.55" strokeLinecap="round" fill="none" />
      {/* حافة الغطاء */}
      <path d="M35.5 55C40 50 44.5 47.5 48 47.5s8 2.5 12.5 7.5" stroke="#c98a6f" strokeWidth="1.4" strokeOpacity="0.28" strokeLinecap="round" fill="none" />

      {/* المقبض العلوي (ذهبي) */}
      <rect x="46.6" y="30.5" width="2.8" height="5" rx="1.4" fill={`url(#${id}-gold)`} />
      <circle cx="48" cy="29.5" r="3" fill={`url(#${id}-gold)`} />

      {/* قاعدة الطاجن */}
      <rect x="26" y="61.5" width="44" height="9" rx="4.5" fill={`url(#${id}-pot)`} />
      {/* الصحن الذهبي */}
      <path d="M23.5 73h49" stroke={`url(#${id}-gold)`} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
