import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { bidirectionalScroll } from '../../src/core/bidirectional-scroll'

describe('bidirectionalScroll', () => {
  let container: HTMLElement

  beforeEach(() => {
    container = document.createElement('div')
    for (let i = 0; i < 5; i++) {
      const item = document.createElement('div')
      item.id = `item-${i}`
      item.textContent = `Item ${i}`
      container.appendChild(item)
    }
    document.body.appendChild(container)
    vi.useFakeTimers()
  })

  afterEach(() => {
    container.remove()
    vi.useRealTimers()
  })

  it('상단/하단 트리거를 container에 추가', () => {
    const instance = bidirectionalScroll({
      container,
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
    })

    expect(container.querySelector('[data-bidir-scroll-trigger="before"]')).toBeTruthy()
    expect(container.querySelector('[data-bidir-scroll-trigger="after"]')).toBeTruthy()

    instance.destroy()
  })

  it('entryAnchor로 초기 scrollIntoView 호출 (selector)', () => {
    const target = container.querySelector<HTMLElement>('#item-2')!
    const scrollSpy = vi.spyOn(target, 'scrollIntoView')

    const instance = bidirectionalScroll({
      container,
      entryAnchor: '#item-2',
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
      safariCorrection: false,
    })

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })

    instance.destroy()
  })

  it('overscrollBehavior를 container에 적용', () => {
    const instance = bidirectionalScroll({
      container,
      overscrollBehavior: 'contain',
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
    })

    expect(container.style.overscrollBehavior).toBe('contain')

    instance.destroy()
  })

  it('destroy 시 overscrollBehavior를 이전 값으로 복구', () => {
    container.style.overscrollBehavior = 'auto'

    const instance = bidirectionalScroll({
      container,
      overscrollBehavior: 'contain',
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
    })

    expect(container.style.overscrollBehavior).toBe('contain')

    instance.destroy()

    expect(container.style.overscrollBehavior).toBe('auto')
  })

  it('entryAnchor로 초기 scrollIntoView 호출 (element)', () => {
    const target = container.querySelector<HTMLElement>('#item-3')!
    const scrollSpy = vi.spyOn(target, 'scrollIntoView')

    const instance = bidirectionalScroll({
      container,
      entryAnchor: target,
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
      safariCorrection: false,
    })

    expect(scrollSpy).toHaveBeenCalled()

    instance.destroy()
  })

  it('anchorToPrevious: 지정 요소로 스크롤', () => {
    const instance = bidirectionalScroll({
      container,
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
      safariCorrection: false,
    })

    const target = container.querySelector<HTMLElement>('#item-1')!
    const scrollSpy = vi.spyOn(target, 'scrollIntoView')

    instance.anchorToPrevious(target)

    expect(scrollSpy).toHaveBeenCalled()

    instance.destroy()
  })

  it('onLoadPrevious 완료 후 이전 첫 아이템으로 자동 앵커링', async () => {
    const previousFirst = container.querySelector<HTMLElement>('#item-0')!
    const scrollSpy = vi.spyOn(previousFirst, 'scrollIntoView')

    const instance = bidirectionalScroll({
      container,
      safariCorrection: false,
      async onLoadPrevious() {
        const prepended = document.createElement('div')
        prepended.id = 'item-new'
        prepended.textContent = 'Prepended'
        container.prepend(prepended)
      },
      onLoadNext: vi.fn(),
    })

    const topObserver = Array.from((globalThis as any).__mockIntersectionObservers)[0]
    topObserver.callback([{ isIntersecting: true }], {})
    await Promise.resolve()

    expect(scrollSpy).toHaveBeenCalled()

    instance.destroy()
  })

  it('onLoadPrevious가 진행 중일 때 중복 호출을 막음', async () => {
    let resolveLoad: (() => void) | undefined
    const onLoadPrevious = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveLoad = resolve
        }),
    )

    const instance = bidirectionalScroll({
      container,
      onLoadPrevious,
      onLoadNext: vi.fn(),
    })

    const topObserver = Array.from((globalThis as any).__mockIntersectionObservers)[0]
    topObserver.callback([{ isIntersecting: true }], {})
    topObserver.callback([{ isIntersecting: true }], {})

    expect(onLoadPrevious).toHaveBeenCalledTimes(1)

    resolveLoad?.()
    await Promise.resolve()

    instance.destroy()
  })

  it('onLoadNext가 진행 중일 때 중복 호출을 막음', async () => {
    let resolveLoad: (() => void) | undefined
    const onLoadNext = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveLoad = resolve
        }),
    )

    const instance = bidirectionalScroll({
      container,
      onLoadPrevious: vi.fn(),
      onLoadNext,
    })

    const observers = Array.from((globalThis as any).__mockIntersectionObservers)
    const bottomObserver = observers[1]
    bottomObserver.callback([{ isIntersecting: true }], {})
    bottomObserver.callback([{ isIntersecting: true }], {})

    expect(onLoadNext).toHaveBeenCalledTimes(1)

    resolveLoad?.()
    await Promise.resolve()

    instance.destroy()
  })

  it('scrollTo: 특정 요소로 스크롤', () => {
    const instance = bidirectionalScroll({
      container,
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
      safariCorrection: false,
    })

    const target = container.querySelector<HTMLElement>('#item-4')!
    const scrollSpy = vi.spyOn(target, 'scrollIntoView')

    instance.scrollTo(target)

    expect(scrollSpy).toHaveBeenCalled()

    instance.destroy()
  })

  it('destroy 시 트리거 제거 + rAF cleanup', () => {
    const instance = bidirectionalScroll({
      container,
      entryAnchor: '#item-2',
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
      safariCorrection: true,
    })

    expect(container.querySelector('[data-bidir-scroll-trigger="before"]')).toBeTruthy()
    expect(container.querySelector('[data-bidir-scroll-trigger="after"]')).toBeTruthy()

    instance.destroy()

    expect(container.querySelector('[data-bidir-scroll-trigger="before"]')).toBeNull()
    expect(container.querySelector('[data-bidir-scroll-trigger="after"]')).toBeNull()

    vi.advanceTimersByTime(32)
  })

  it('존재하지 않는 entryAnchor selector는 무시', () => {
    const instance = bidirectionalScroll({
      container,
      entryAnchor: '#nonexistent',
      onLoadPrevious: vi.fn(),
      onLoadNext: vi.fn(),
    })

    instance.destroy()
  })
})
