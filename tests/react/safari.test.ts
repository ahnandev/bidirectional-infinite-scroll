import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { isSafariOrIOS, safeScrollIntoView } from '../../src/safari'

describe('isSafariOrIOS', () => {
  const originalNavigator = globalThis.navigator

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })

  it('서버 환경(navigator 없음)에서 false 반환', () => {
    Object.defineProperty(globalThis, 'navigator', { value: undefined, configurable: true })
    expect(isSafariOrIOS()).toBe(false)
  })

  it('Chrome UA에서 false 반환', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36', platform: 'MacIntel', maxTouchPoints: 0 },
      configurable: true,
    })
    expect(isSafariOrIOS()).toBe(false)
  })

  it('Safari UA에서 true 반환', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 0 },
      configurable: true,
    })
    expect(isSafariOrIOS()).toBe(true)
  })

  it('iPhone UA에서 true 반환', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)', platform: 'iPhone', maxTouchPoints: 5 },
      configurable: true,
    })
    expect(isSafariOrIOS()).toBe(true)
  })

  it('iPad(데스크톱 모드)에서 true 반환', () => {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 },
      configurable: true,
    })
    expect(isSafariOrIOS()).toBe(true)
  })
})

describe('safeScrollIntoView', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = document.createElement('div')
    document.body.appendChild(element)
    vi.useFakeTimers()
    vi.mocked(element.scrollIntoView).mockClear()
  })

  afterEach(() => {
    element.remove()
    vi.useRealTimers()
  })

  it('scrollIntoView를 즉시 호출', () => {
    safeScrollIntoView(element, { behavior: 'instant', block: 'start' }, false)
    expect(element.scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' })
  })

  it('Safari 보정 비활성화 시 cleanup 없음 (undefined 반환)', () => {
    const cleanup = safeScrollIntoView(element, undefined, false)
    expect(cleanup).toBeUndefined()
  })

  it('Safari 보정 활성화 시 cleanup 함수 반환', () => {
    const cleanup = safeScrollIntoView(element, undefined, true)
    expect(cleanup).toBeTypeOf('function')
  })

  it('Safari 보정: 이중 rAF 후 scrollIntoView 재호출', () => {
    safeScrollIntoView(element, { behavior: 'instant', block: 'start' }, true)

    expect(element.scrollIntoView).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(16)
    vi.advanceTimersByTime(16)

    expect(element.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('cleanup 호출 시 rAF가 취소되어 scrollIntoView 재호출 안 됨', () => {
    const cleanup = safeScrollIntoView(element, { behavior: 'instant', block: 'start' }, true)

    expect(element.scrollIntoView).toHaveBeenCalledTimes(1)

    cleanup!()

    vi.advanceTimersByTime(32)

    expect(element.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('outer rAF 실행 후 cleanup해도 inner rAF 취소됨', () => {
    const cleanup = safeScrollIntoView(element, { behavior: 'instant', block: 'start' }, true)

    vi.advanceTimersByTime(16)
    expect(element.scrollIntoView).toHaveBeenCalledTimes(1)

    cleanup!()

    vi.advanceTimersByTime(16)
    expect(element.scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
