// jsdom doesn't implement scrollIntoView
HTMLElement.prototype.scrollIntoView = vi.fn()

// jsdom IntersectionObserver mock
const observers = new Set<{
  callback: IntersectionObserverCallback
  elements: Set<Element>
  options?: IntersectionObserverInit
}>()

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null
  rootMargin: string = '0px'
  readonly thresholds: ReadonlyArray<number> = [0]

  private _callback: IntersectionObserverCallback
  private _elements = new Set<Element>()
  private _record: { callback: IntersectionObserverCallback; elements: Set<Element>; options?: IntersectionObserverInit }

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this._callback = callback
    if (options?.rootMargin) this.rootMargin = options.rootMargin
    this._record = { callback, elements: this._elements, options }
    observers.add(this._record)
  }

  observe(target: Element) {
    this._elements.add(target)
  }

  unobserve(target: Element) {
    this._elements.delete(target)
  }

  disconnect() {
    this._elements.clear()
    observers.delete(this._record)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  simulateIntersection(isIntersecting: boolean) {
    const entries = Array.from(this._elements).map(
      target =>
        ({
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now(),
        }) as IntersectionObserverEntry,
    )
    this._callback(entries, this)
  }
}

;(globalThis as any).__mockIntersectionObservers = observers
;(globalThis as any).IntersectionObserver = MockIntersectionObserver
;(globalThis as any).MockIntersectionObserver = MockIntersectionObserver

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 16) as unknown as number
  globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)
}
