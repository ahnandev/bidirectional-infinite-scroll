import * as React from 'react'

export interface FetchMoreProps {
  /** Whether there are more items to load */
  hasMore: boolean
  /** Whether currently loading */
  loading?: boolean
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
  loading = false,
  onIntersect,
  observerInit,
}: FetchMoreProps) {
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const inFlightRef = React.useRef(false)
  const handlerRef = React.useRef(onIntersect)
  handlerRef.current = onIntersect

  const hasMoreRef = React.useRef(hasMore)
  hasMoreRef.current = hasMore
  const loadingRef = React.useRef(loading)
  loadingRef.current = loading

  const threshold = observerInit?.threshold
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold ?? '')

  React.useEffect(() => {
    const el = triggerRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (
        entry.isIntersecting &&
        hasMoreRef.current &&
        !loadingRef.current &&
        !inFlightRef.current
      ) {
        inFlightRef.current = true
        try {
          Promise.resolve(handlerRef.current()).finally(() => {
            inFlightRef.current = false
          })
        } catch (error) {
          inFlightRef.current = false
          throw error
        }
      }
    }, observerInit)

    observer.observe(el)
    return () => observer.disconnect()
  }, [observerInit?.root, observerInit?.rootMargin, thresholdKey])

  return <div ref={triggerRef} style={{ height: 1, pointerEvents: 'none' }} aria-hidden />
}
