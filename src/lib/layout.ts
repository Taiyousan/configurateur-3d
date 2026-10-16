import { useSyncExternalStore } from 'react'

/**
 * - desktop: floating panels around a full-screen view
 * - stacked: portrait phones and tablets, the view on top and a tabbed sheet below
 * - split: landscape phones, the view on the left and the sheet in a column on the right
 */
export type Layout = 'desktop' | 'stacked' | 'split'

// TOUCH matches the (pointer: coarse) rules of styles.css.
const MOBILE = '(max-width: 860px), (max-height: 500px)'
const PORTRAIT = '(orientation: portrait)'
const TOUCH = '(pointer: coarse)'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}

export function useLayout(): Layout {
  const mobile = useMediaQuery(MOBILE)
  const portrait = useMediaQuery(PORTRAIT)
  return !mobile ? 'desktop' : portrait ? 'stacked' : 'split'
}

/** A finger rather than a mouse: no hover, bigger targets, gestures instead of shortcuts. */
export const useTouch = () => useMediaQuery(TOUCH)

export interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * How much of the 3D view the overlaid UI covers, in CSS pixels. The model is
 * framed in what remains. Mirrors the sizes in styles.css.
 */
export function viewInsets(layout: Layout, treeOpen: boolean, touch: boolean): Insets {
  if (layout !== 'desktop') return { top: touch ? 58 : 54, right: 0, bottom: 0, left: 0 }
  const gap = 14
  return { top: 78, right: gap + 300, bottom: 0, left: treeOpen ? gap + 264 : 0 }
}
