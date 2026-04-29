import { useCallback, useEffect, useMemo, useRef } from 'react'

import { safeScrollIntoView } from './safari'

type RefCallback = (el: HTMLElement | null) => void
const DEFAULT_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  behavior: 'instant' as const,
  block: 'start' as const,
}

export interface UseBidirectionalScrollOptions<TKey extends string | number = string | number> {
  /** Item id to anchor on initial render */
  anchorId?: TKey
  /** scrollIntoView options */
  scrollOptions?: ScrollIntoViewOptions
  /** Override Safari correction auto-detect */
  safariCorrection?: boolean
}

export interface ItemRefArgs<TKey extends string | number = string | number> {
  itemId: TKey
  index: number
}

export interface UseBidirectionalScrollResult<TKey extends string | number = string | number> {
  anchorRef: RefCallback
  firstItemRef: RefCallback
  itemRef: (args: ItemRefArgs<TKey>) => RefCallback | undefined
}

function mergeRefs(...refs: Array<RefCallback | undefined>): RefCallback {
  return el => {
    refs.forEach(ref => ref?.(el))
  }
}

/**
 * Hook for bidirectional infinite scroll.
 *
 * Returns two low-level ref callbacks and one convenience helper:
 * - `anchorRef`: attach to the anchor item → auto scrollIntoView on first mount
 * - `firstItemRef`: attach to items[0] → auto re-anchor when first item changes (prepend detected)
 * - `itemRef`: convenience helper that combines `anchorRef` and `firstItemRef`
 *
 * If the anchor item is also the first item, attach both refs to the same element.
 *
 * ```tsx
 * const { itemRef } = useBidirectionalScroll({
 *   anchorId,
 * })
 *
 * {items.map((item, i) => (
 *   <div
 *     key={item.id}
 *     ref={itemRef({ itemId: item.id, index: i })}
 *   >
 * ))}
 * ```
 */
export function useBidirectionalScroll<TKey extends string | number = string | number>(
  options: UseBidirectionalScrollOptions<TKey> = {},
): UseBidirectionalScrollResult<TKey> {
  const {
    anchorId,
    scrollOptions = DEFAULT_SCROLL_OPTIONS,
    safariCorrection,
  } = options

  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  const hasScrolledToEntry = useRef(false)
  const firstElRef = useRef<HTMLElement | null>(null)
  const prevFirstElRef = useRef<HTMLElement | null>(null)

  useEffect(() => () => cleanupRef.current?.(), [])

  const anchorRef = useCallback(
    (el: HTMLElement | null) => {
      if (el && !hasScrolledToEntry.current) {
        hasScrolledToEntry.current = true
        cleanupRef.current?.()
        cleanupRef.current = safeScrollIntoView(el, scrollOptions, safariCorrection)
      }
    },
    [scrollOptions, safariCorrection],
  )

  const firstItemRef = useCallback(
    (el: HTMLElement | null) => {
      if (el === null) {
        prevFirstElRef.current = firstElRef.current
        firstElRef.current = null
        return
      }

      firstElRef.current = el

      if (prevFirstElRef.current && prevFirstElRef.current !== el) {
        cleanupRef.current?.()
        cleanupRef.current = safeScrollIntoView(prevFirstElRef.current, scrollOptions, safariCorrection)
        prevFirstElRef.current = null
      }
    },
    [scrollOptions, safariCorrection],
  )

  const mergedItemRef = useMemo(
    () => mergeRefs(anchorRef, firstItemRef),
    [anchorRef, firstItemRef],
  )

  const itemRef = useCallback(
    ({ itemId, index }: ItemRefArgs<TKey>) => {
      const isFirst = index === 0
      const isAnchor = anchorId !== undefined && itemId === anchorId

      if (isFirst && isAnchor) return mergedItemRef
      if (isAnchor) return anchorRef
      if (isFirst) return firstItemRef
      return undefined
    },
    [anchorId, anchorRef, firstItemRef, mergedItemRef],
  )

  return { anchorRef, firstItemRef, itemRef }
}
