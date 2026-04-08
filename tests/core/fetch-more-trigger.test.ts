import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchMoreTrigger } from '../../src/core/fetch-more-trigger'

describe('fetchMoreTrigger', () => {
  let parent: HTMLElement

  beforeEach(() => {
    parent = document.createElement('div')
    document.body.appendChild(parent)
  })

  afterEach(() => {
    parent.remove()
  })

  it('트리거 요소를 parent에 추가 (before)', () => {
    const existing = document.createElement('div')
    existing.textContent = 'content'
    parent.appendChild(existing)

    fetchMoreTrigger(parent, 'before', { onIntersect: vi.fn() })

    // 첫 번째 자식이 트리거여야 함
    expect(parent.firstElementChild?.getAttribute('data-bidir-scroll-trigger')).toBe('before')
    expect(parent.children.length).toBe(2)
  })

  it('트리거 요소를 parent에 추가 (after)', () => {
    const existing = document.createElement('div')
    existing.textContent = 'content'
    parent.appendChild(existing)

    fetchMoreTrigger(parent, 'after', { onIntersect: vi.fn() })

    // 마지막 자식이 트리거여야 함
    expect(parent.lastElementChild?.getAttribute('data-bidir-scroll-trigger')).toBe('after')
    expect(parent.children.length).toBe(2)
  })

  it('트리거가 aria-hidden이고 pointer-events: none', () => {
    const { trigger } = fetchMoreTrigger(parent, 'before', { onIntersect: vi.fn() })

    expect(trigger.getAttribute('aria-hidden')).toBe('true')
    expect(trigger.style.pointerEvents).toBe('none')
    expect(trigger.style.height).toBe('1px')
  })

  it('IntersectionObserver에 트리거 등록됨', () => {
    const onIntersect = vi.fn()
    const { observer } = fetchMoreTrigger(parent, 'after', { onIntersect })

    // mock observer에서 simulate
    ;(observer as any).simulateIntersection(true)
    expect(onIntersect).toHaveBeenCalledTimes(1)
  })

  it('교차하지 않으면 콜백 호출 안 됨', () => {
    const onIntersect = vi.fn()
    const { observer } = fetchMoreTrigger(parent, 'after', { onIntersect })

    ;(observer as any).simulateIntersection(false)
    expect(onIntersect).not.toHaveBeenCalled()
  })

  it('destroy 시 observer disconnect + 트리거 DOM 제거', () => {
    const { trigger, observer, destroy } = fetchMoreTrigger(parent, 'before', { onIntersect: vi.fn() })

    const disconnectSpy = vi.spyOn(observer, 'disconnect')

    expect(parent.contains(trigger)).toBe(true)

    destroy()

    expect(disconnectSpy).toHaveBeenCalled()
    expect(parent.contains(trigger)).toBe(false)
  })

  it('observerInit 옵션이 전달됨', () => {
    const { observer } = fetchMoreTrigger(parent, 'after', {
      onIntersect: vi.fn(),
      observerInit: { rootMargin: '100px' },
    })

    // mock에서는 rootMargin이 설정됨
    expect(observer.rootMargin).toBe('100px')
  })
})
