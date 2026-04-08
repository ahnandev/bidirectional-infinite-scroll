import { fetchMoreTrigger } from './fetch-more-trigger'
import { safeScrollIntoView } from './safari'
import type { BidirScrollInstance, BidirScrollOptions } from './types'

const DEFAULT_SCROLL_OPTIONS: ScrollIntoViewOptions = { behavior: 'instant', block: 'start' }

/**
 * Bidirectional infinite scroll setup.
 *
 * Uses IntersectionObserver for load triggers and scrollIntoView for scroll anchoring.
 * Includes automatic Safari/iOS layout shift correction via double-rAF.
 */
export function bidirectionalScroll(options: BidirScrollOptions): BidirScrollInstance {
  const {
    container,
    entryAnchor,
    overscrollBehavior,
    onLoadPrevious,
    onLoadNext,
    autoAnchorOnPrepend = true,
    observerInit = { rootMargin: '50px' },
    scrollOptions = DEFAULT_SCROLL_OPTIONS,
    safariCorrection,
  } = options

  let cleanupRaf: (() => void) | undefined
  let previousOverscrollBehavior: CSSStyleDeclaration['overscrollBehavior'] | undefined
  let loadingPrevious = false
  let loadingNext = false

  const getFirstContentElement = () =>
    Array.from(container.children).find(
      child => !(child instanceof HTMLElement && child.dataset.bidirScrollTrigger),
    ) as HTMLElement | undefined

  const anchorElement = (element: HTMLElement) => {
    cleanupRaf?.()
    cleanupRaf = safeScrollIntoView(element, scrollOptions, safariCorrection)
  }

  if (overscrollBehavior) {
    previousOverscrollBehavior = container.style.overscrollBehavior
    container.style.overscrollBehavior = overscrollBehavior
  }

  if (entryAnchor) {
    const el =
      typeof entryAnchor === 'string' ? container.querySelector<HTMLElement>(entryAnchor) : entryAnchor
    if (el) {
      anchorElement(el)
    }
  }

  const topTrigger = fetchMoreTrigger(container, 'before', {
    async onIntersect() {
      if (loadingPrevious) return
      loadingPrevious = true
      const previousFirst = autoAnchorOnPrepend ? getFirstContentElement() : undefined
      try {
        await onLoadPrevious()
        if (previousFirst && container.contains(previousFirst)) {
          anchorElement(previousFirst)
        }
      } finally {
        loadingPrevious = false
      }
    },
    observerInit,
  })

  const bottomTrigger = fetchMoreTrigger(container, 'after', {
    async onIntersect() {
      if (loadingNext) return
      loadingNext = true
      try {
        await onLoadNext()
      } finally {
        loadingNext = false
      }
    },
    observerInit,
  })

  return {
    anchorToPrevious(element: HTMLElement) {
      anchorElement(element)
    },

    scrollTo(element: HTMLElement) {
      anchorElement(element)
    },

    destroy() {
      cleanupRaf?.()
      topTrigger.destroy()
      bottomTrigger.destroy()
      if (overscrollBehavior) {
        container.style.overscrollBehavior = previousOverscrollBehavior ?? ''
      }
    },
  }
}
