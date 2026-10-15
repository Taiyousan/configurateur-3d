import type { SVGProps } from 'react'

// Line icons after Lucide (24×24, stroke currentColor).
const paths = {
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  camera:
    'M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff:
    'M9.9 4.2A9.6 9.6 0 0 1 12 4c6.5 0 10 7 10 7a17 17 0 0 1-2.2 3.2M6.6 6.6C3.9 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M14.1 14.1a3 3 0 1 1-4.2-4.2M2 2l20 20',
  chevron: 'M9 18l6-6-6-6',
  chevronDown: 'M6 9l6 6 6-6',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5V8zM3 8l9 5 9-5M12 13v8',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  undo: 'M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13',
  redo: 'M21 7v6h-6M3 17a9 9 0 0 1 15-6.7L21 13',
  focus: 'M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  dice: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01',
  plus: 'M12 5v14M5 12h14',
  x: 'M18 6 6 18M6 6l12 12',
  reset: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  help: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  pointer: 'M4 4l7 17 2.5-7.5L21 11z',
  orbit:
    'M16.5 7.5C15.6 4.2 14 2 12 2 9.2 2 7 6.5 7 12s2.2 10 5 10c.3 0 .7-.1 1-.2M15.2 13.7l3.8 1.9-1.9 3.8M19 15.6c-1.8.9-4.3 1.4-7 1.4-5.5 0-10-2.2-10-5s4.5-5 10-5c4.8 0 8.9 1.7 9.8 4',
  palette:
    'M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.8a2 2 0 0 0-1.5 3.3c.6.7.1 2.7-2.7 2.7zM7.5 11h.01M10 7h.01M15 7.5h.01M17.5 11h.01',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, size = 16, ...props }: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  )
}
