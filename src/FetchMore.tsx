import * as React from 'react'

export interface FetchMoreProps {
  /** Whether there are more items to load */
  hasMore: boolean
  /** Called when trigger enters the viewport */
  onIntersect: () => void | Promise<void>
  /** IntersectionObserver options */
  observerInit?: IntersectionObserverInit
}

/**
 * Invisible trigger element that fires onIntersect when it enters the viewport.
 * Place at the top or bottom of your list to trigger pagination.
 */
export function FetchMore({
  hasMore,
  onIntersect,
  observerInit,
}: FetchMoreProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const inFlightRef = React.useRef(false)
  const handlerRef = React.useRef(onIntersect)
  handlerRef.current = onIntersect

  const hasMoreRef = React.useRef(hasMore)
  hasMoreRef.current = hasMore

  const thresholdKey = String(observerInit?.threshold ?? '')

  React.useEffect(() => {
    const el = triggerRef.current
    if (!el) return

    const observer = new IntersectionObserver(async ([entry]) => {
      if (!entry.isIntersecting || !hasMoreRef.current || inFlightRef.current) return
      inFlightRef.current = true
      try {
        await handlerRef.current()
      } finally {
        inFlightRef.current = false
      }
    }, observerInit)

    observer.observe(el)
    return () => observer.disconnect()
  }, [observerInit?.root, observerInit?.rootMargin, thresholdKey])

  return <div ref={triggerRef} style={{ height: 1, pointerEvents: 'none' }} aria-hidden />
}
