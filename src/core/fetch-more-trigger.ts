import type { FetchMoreTriggerOptions } from './types'

export interface FetchMoreTriggerInstance {
  trigger: HTMLElement
  observer: IntersectionObserver
  destroy: () => void
}

/**
 * Invisible trigger element observed by IntersectionObserver.
 * When visible, calls the provided callback to load more data.
 */
export function fetchMoreTrigger(
  parent: HTMLElement,
  position: 'before' | 'after',
  options: FetchMoreTriggerOptions,
): FetchMoreTriggerInstance {
  const trigger = document.createElement('div')
  trigger.style.height = '1px'
  trigger.style.width = '100%'
  trigger.style.pointerEvents = 'none'
  trigger.setAttribute('aria-hidden', 'true')
  trigger.dataset.bidirScrollTrigger = position

  if (position === 'before') {
    parent.prepend(trigger)
  } else {
    parent.append(trigger)
  }

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      options.onIntersect()
    }
  }, options.observerInit)

  observer.observe(trigger)

  return {
    trigger,
    observer,
    destroy() {
      observer.disconnect()
      trigger.remove()
    },
  }
}
