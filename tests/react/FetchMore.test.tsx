import React from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { FetchMore } from '../../src/FetchMore'

afterEach(cleanup)

function getLatestObserver() {
  const observers = (globalThis as any).__mockIntersectionObservers as Set<any>
  return Array.from(observers).pop()
}

describe('FetchMore', () => {
  it('보이지 않는 트리거 div 렌더', () => {
    const { container } = render(
      <FetchMore hasMore={true} onIntersect={vi.fn()} />,
    )

    const trigger = container.firstElementChild as HTMLElement
    expect(trigger.tagName).toBe('DIV')
    expect(trigger.style.height).toBe('1px')
    expect(trigger.style.pointerEvents).toBe('none')
    expect(trigger.getAttribute('aria-hidden')).toBe('true')
  })

  it('뷰포트 진입 시 onIntersect 호출', () => {
    const onIntersect = vi.fn()
    render(<FetchMore hasMore={true} onIntersect={onIntersect} />)

    const obs = getLatestObserver()
    act(() => {
      obs.callback([{ isIntersecting: true }], {})
    })

    expect(onIntersect).toHaveBeenCalledTimes(1)
  })

  it('onIntersect Promise 처리 중이면 중복 호출 안 됨', async () => {
    let resolveLoad!: () => void
    const onIntersect = vi.fn(
      () =>
        new Promise<void>(resolve => {
          resolveLoad = resolve
        }),
    )

    render(<FetchMore hasMore={true} onIntersect={onIntersect} />)

    const obs = getLatestObserver()
    act(() => {
      obs.callback([{ isIntersecting: true }], {})
      obs.callback([{ isIntersecting: true }], {})
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onIntersect).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveLoad()
      await Promise.resolve()
    })

    act(() => {
      obs.callback([{ isIntersecting: true }], {})
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(onIntersect).toHaveBeenCalledTimes(2)
  })

  it('hasMore=false이면 onIntersect 호출 안 됨', () => {
    const onIntersect = vi.fn()
    render(<FetchMore hasMore={false} onIntersect={onIntersect} />)

    const obs = getLatestObserver()
    act(() => {
      obs.callback([{ isIntersecting: true }], {})
    })

    expect(onIntersect).not.toHaveBeenCalled()
  })

  it('isIntersecting=false이면 호출 안 됨', () => {
    const onIntersect = vi.fn()
    render(<FetchMore hasMore={true} onIntersect={onIntersect} />)

    const obs = getLatestObserver()
    act(() => {
      obs.callback([{ isIntersecting: false }], {})
    })

    expect(onIntersect).not.toHaveBeenCalled()
  })

  it('unmount 시 observer disconnect', () => {
    const { unmount } = render(
      <FetchMore hasMore={true} onIntersect={vi.fn()} />,
    )

    const obs = getLatestObserver()
    expect(obs.elements.size).toBe(1)

    unmount()

    expect(obs.elements.size).toBe(0)
  })

  it('observerInit 변경 시 observer를 다시 생성', () => {
    const onIntersect = vi.fn()
    const { rerender } = render(
      <FetchMore
        hasMore={true}
        onIntersect={onIntersect}
        observerInit={{ rootMargin: '10px' }}
      />,
    )

    const firstObs = getLatestObserver()
    expect(firstObs.options?.rootMargin).toBe('10px')

    rerender(
      <FetchMore
        hasMore={true}
        onIntersect={onIntersect}
        observerInit={{ rootMargin: '200px' }}
      />,
    )

    const secondObs = getLatestObserver()
    expect(secondObs).not.toBe(firstObs)
    expect(secondObs.options?.rootMargin).toBe('200px')
    expect(firstObs.elements.size).toBe(0)
  })
})
