/** Detect Safari or iOS browser for layout shift workaround */
export function isSafariOrIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return isSafari || isIOS
}

/**
 * scrollIntoView with Safari/iOS rAF correction.
 * On Safari/iOS, DOM changes can cause layout shifts that disrupt scrollIntoView.
 * Double-nested rAF ensures at least one layout+paint cycle completes before re-scrolling.
 *
 * Returns a cleanup function that cancels pending rAFs.
 */
export function safeScrollIntoView(
  element: HTMLElement,
  options: ScrollIntoViewOptions = { behavior: 'instant', block: 'start' },
  applySafariCorrection?: boolean,
): (() => void) | undefined {
  element.scrollIntoView(options)

  const shouldCorrect = applySafariCorrection ?? isSafariOrIOS()
  if (!shouldCorrect) return undefined

  let innerRaf: number
  const outerRaf = requestAnimationFrame(() => {
    innerRaf = requestAnimationFrame(() => {
      element.scrollIntoView(options)
    })
  })

  return () => {
    cancelAnimationFrame(outerRaf)
    cancelAnimationFrame(innerRaf)
  }
}
