// نظام أيقونات SVG احترافي (بلا إيموجي، بلا تبعيات خارجية، يعمل دون اتصال)
// أيقونات خطّية نظيفة ترث لون النص وحجمه.

const PATHS = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" /></>,
  book: <><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /><path d="M9 7h6M9 11h6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  camera: <><path d="M5 8h3l1.5-2h5L16 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.2" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  edit: <><path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" /><path d="M13.5 6.5l3 3" /></>,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
  check: <><path d="m5 12 5 5L20 6" /></>,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 5-5" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  xCircle: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6M15 9l-6 6" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m6 6 12 12" /></>,
  back: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  users: <><circle cx="9" cy="8" r="3.4" /><path d="M3 19c0-3.3 2.7-5 6-5s6 1.7 6 5" /><path d="M16 5.2A3.4 3.4 0 0 1 16 12M21 19c0-2.6-1.4-4.2-3.5-4.8" /></>,
  tag: <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-7 7-9-9z" /><circle cx="7.5" cy="7.5" r="1.4" /></>,
  bulb: <><path d="M9 18h6" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.2 1 2.5h6c0-1.3.3-1.8 1-2.5A6 6 0 0 0 12 3z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></>,
  logout: <><path d="M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3" /><path d="M10 12H3" /><path d="m6 8-4 4 4 4" /></>,
  shield: <><path d="M12 3 5 6v5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  star: <><path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.8z" /></>,
  moon: <><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" /></>,
  text: <><path d="M4 7V5h16v2" /><path d="M9 5v14M15 9v10M7 19h4M13 19h4" /></>,
  send: <><path d="M21 4 3 11l7 3 3 7z" /><path d="M21 4 10 14" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  hourglass: <><path d="M7 3h10M7 21h10" /><path d="M7 3c0 4 5 5 5 9s-5 5-5 9M17 3c0 4-5 5-5 9s5 5 5 9" /></>,
  inbox: <><path d="M3 13h5l1.5 2.5h5L21 13" /><path d="M5 5h14l2 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 9v5M12 17h.01" /></>,
  pot: <><path d="M4 10h16" /><path d="M5 10v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" /><path d="M2 10h2M20 10h2" /><path d="M9 6c0-1.5 1.5-1.5 1.5-3M13.5 6c0-1.5 1.5-1.5 1.5-3" /></>,
  chef: <><path d="M7 14a4 4 0 0 1-1-7.9A4 4 0 0 1 13.9 5 4 4 0 0 1 18 6.1 4 4 0 0 1 17 14z" /><path d="M8 14v5a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-5" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M4 4l16 16" /><path d="M9.9 5.2A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8M6 7.5A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 3-.5" /></>,
  refresh: <><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3v4h-4" /></>,
}

export default function Icon({ name, size = 24, strokeWidth = 1.9, className, style }) {
  const path = PATHS[name]
  if (!path) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  )
}
