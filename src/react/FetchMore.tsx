import React, { useEffect, useRef } from 'react'

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
  const triggerRef = useRef<HTMLDivElement>(null)
  const handlerRef = useRef(onIntersect)
  handlerRef.current = onIntersect

  const hasMoreRef = useRef(hasMore)
  hasMoreRef.current = hasMore
  const loadingRef = useRef(loading)
  loadingRef.current = loading
  const threshold = observerInit?.threshold
  const thresholdKey = Array.isArray(threshold) ? threshold.join(',') : String(threshold ?? '')

  useEffect(() => {
    const el = triggerRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
        handlerRef.current()
      }
    }, observerInit)

    observer.observe(el)
    return () => observer.disconnect()
  }, [observerInit?.root, observerInit?.rootMargin, thresholdKey])

  return <div ref={triggerRef} style={{ height: 1, pointerEvents: 'none' }} aria-hidden />
}
