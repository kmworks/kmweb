import { useId } from 'react'

export function LogoMark({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F28E33" />
          <stop offset="0.55" stopColor="#A62CA3" />
          <stop offset="1" stopColor="#642891" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path
        d="M16 9.6c-2.1-1.7-4.8-2.2-7.2-1.7v13.6c2.4-.5 5.1 0 7.2 1.7 2.1-1.7 4.8-2.2 7.2-1.7V7.9c-2.4-.5-5.1 0-7.2 1.7Z"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M16 9.6v13.6" stroke="#fff" strokeWidth="1.7" />
    </svg>
  )
}
