export interface FetchMoreTriggerOptions {
  /** Called when the trigger element enters the viewport */
  onIntersect: () => void | Promise<void>
  /** IntersectionObserver options (rootMargin, threshold, etc.) */
  observerInit?: IntersectionObserverInit
}

export interface ScrollAnchorOptions {
  /** scrollIntoView options. Defaults to { behavior: 'instant', block: 'start' } */
  scrollOptions?: ScrollIntoViewOptions
  /** Apply Safari/iOS rAF correction. Defaults to auto-detect. */
  safariCorrection?: boolean
}

export interface BidirScrollOptions {
  /** The scrollable container element (items' parent) */
  container: HTMLElement
  /** Selector or element to use as the entry anchor */
  entryAnchor?: string | HTMLElement
  /** Optional overscroll-behavior applied to the container */
  overscrollBehavior?: CSSStyleDeclaration['overscrollBehavior']
  /** Called when upper trigger is intersected */
  onLoadPrevious: () => void | Promise<void>
  /** Called when lower trigger is intersected */
  onLoadNext: () => void | Promise<void>
  /** Automatically re-anchor to the previous first content element after onLoadPrevious resolves */
  autoAnchorOnPrepend?: boolean
  /** IntersectionObserver options for triggers */
  observerInit?: IntersectionObserverInit
  /** scrollIntoView options */
  scrollOptions?: ScrollIntoViewOptions
  /** Apply Safari/iOS rAF correction. Defaults to auto-detect. */
  safariCorrection?: boolean
}

export interface BidirScrollInstance {
  /** Re-anchor scroll position after prepending items. Call with the element that was previously first. */
  anchorToPrevious: (element: HTMLElement) => void
  /** Scroll to a specific element */
  scrollTo: (element: HTMLElement) => void
  /** Destroy observers and clean up */
  destroy: () => void
}
