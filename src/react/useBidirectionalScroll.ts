import { useCallback, useEffect, useRef } from 'react'

import { safeScrollIntoView } from '../core/safari'

export interface UseBidirectionalScrollOptions {
  /** scrollIntoView options */
  scrollOptions?: ScrollIntoViewOptions
  /** Override Safari correction auto-detect */
  safariCorrection?: boolean
}

/**
 * Hook for bidirectional infinite scroll.
 *
 * Returns two low-level ref callbacks:
 * - `anchorRef`: attach to the entry item → auto scrollIntoView on first mount
 * - `firstItemRef`: attach to items[0] → auto re-anchor when first item changes (prepend detected)
 *
 * If the entry item is also the first item, attach both refs to the same element.
 *
 * ```tsx
 * const { anchorRef, firstItemRef } = useBidirectionalScroll()
 *
 * {items.map((item, i) => (
 *   <div
 *     key={item.id}
 *     ref={
 *       item.id === entryId && i === 0
 *         ? el => { anchorRef(el); firstItemRef(el) }
 *         : item.id === entryId
 *           ? anchorRef
 *           : i === 0
 *             ? firstItemRef
 *             : undefined
 *     }
 *   >
 * ))}
 * ```
 */
export function useBidirectionalScroll(options: UseBidirectionalScrollOptions = {}) {
  const {
    scrollOptions = { behavior: 'instant' as const, block: 'start' as const },
    safariCorrection,
  } = options

  const cleanupRef = useRef<(() => void) | undefined>(undefined)
  const hasScrolledToEntry = useRef(false)
  const firstElRef = useRef<HTMLElement | null>(null)
  const prevFirstElRef = useRef<HTMLElement | null>(null)

  // Unmount 시 rAF cleanup
  useEffect(() => () => cleanupRef.current?.(), [])

  /**
   * 진입 아이템에 붙이는 ref.
   * 첫 attach 시 자동으로 scrollIntoView 호출 (1회).
   */
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

  /**
   * 첫 번째 아이템에 붙이는 ref.
   * 아이템이 위에 추가되면(= ref가 새 element로 바뀌면)
   * 이전 첫 번째 element로 자동 앵커링하여 스크롤 점프 방지.
   *
   * React ref callback lifecycle:
   *   1. 기존 element 해제 → callback(null)
   *   2. 새 element 연결 → callback(newEl)
   */
  const firstItemRef = useCallback(
    (el: HTMLElement | null) => {
      if (el === null) {
        // 기존 첫 번째 element 해제 → 기억해둠
        prevFirstElRef.current = firstElRef.current
        firstElRef.current = null
        return
      }

      firstElRef.current = el

      // 이전 첫 번째 element가 있고 다른 element면 → 프리펜드 발생
      if (prevFirstElRef.current && prevFirstElRef.current !== el) {
        cleanupRef.current?.()
        cleanupRef.current = safeScrollIntoView(prevFirstElRef.current, scrollOptions, safariCorrection)
        prevFirstElRef.current = null
      }
    },
    [scrollOptions, safariCorrection],
  )

  return { anchorRef, firstItemRef }
}
