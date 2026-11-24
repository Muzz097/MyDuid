import { useEffect, useState } from 'react'

const SCROLL_THRESHOLD = 8
const ALWAYS_VISIBLE_SCROLL_Y = 64

export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let lastScrollY = window.scrollY
    let ticking = false

    const handleScroll = () => {
      if (ticking) return

      ticking = true
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        const distance = currentScrollY - lastScrollY

        if (currentScrollY < ALWAYS_VISIBLE_SCROLL_Y) {
          setHidden(false)
        } else if (distance > SCROLL_THRESHOLD) {
          setHidden(true)
        } else if (distance < -SCROLL_THRESHOLD) {
          setHidden(false)
        }

        lastScrollY = currentScrollY
        ticking = false
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return hidden
}
