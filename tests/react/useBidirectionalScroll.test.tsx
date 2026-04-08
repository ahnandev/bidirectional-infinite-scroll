import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { useBidirectionalScroll } from '../../src/react/useBidirectionalScroll'
import { useState } from 'react'

afterEach(cleanup)

describe('useBidirectionalScroll', () => {
  beforeEach(() => {
    vi.mocked(HTMLElement.prototype.scrollIntoView).mockClear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('anchorRef 연결 시 자동으로 scrollIntoView 호출', () => {
    function Test() {
      const { anchorRef } = useBidirectionalScroll({ safariCorrection: false })
      return <div ref={anchorRef}>entry</div>
    }

    render(<Test />)

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'instant',
      block: 'start',
    })
  })

  it('anchorRef는 1회만 scrollIntoView 호출 (리렌더 시 재호출 안 됨)', () => {
    function Test() {
      const [count, setCount] = useState(0)
      const { anchorRef } = useBidirectionalScroll({ safariCorrection: false })
      return (
        <>
          <div ref={anchorRef}>entry</div>
          <button data-testid="rerender" onClick={() => setCount(c => c + 1)}>
            {count}
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)

    act(() => getByTestId('rerender').click())

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('firstItemRef: 첫 번째 아이템이 바뀌면 이전 아이템으로 앵커링', () => {
    function Test() {
      const [items, setItems] = useState(['a', 'b', 'c'])
      const { firstItemRef } = useBidirectionalScroll({ safariCorrection: false })

      return (
        <>
          {items.map((id, i) => (
            <div key={id} ref={i === 0 ? firstItemRef : undefined} data-testid={id}>
              {id}
            </div>
          ))}
          <button
            data-testid="prepend"
            onClick={() => setItems(prev => ['new', ...prev])}
          >
            prepend
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()

    // 아이템 프리펜드 → firstItemRef가 'a'에서 'new'로 이동
    act(() => getByTestId('prepend').click())

    // 이전 첫 번째 아이템('a')으로 앵커링
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('firstItemRef: 같은 아이템이면 앵커링 안 함', () => {
    function Test() {
      const [count, setCount] = useState(0)
      const { firstItemRef } = useBidirectionalScroll({ safariCorrection: false })

      return (
        <>
          <div ref={firstItemRef}>first</div>
          <button data-testid="rerender" onClick={() => setCount(c => c + 1)}>
            {count}
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    act(() => getByTestId('rerender').click())

    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('anchorRef + firstItemRef 동시 사용', () => {
    function Test() {
      const [items, setItems] = useState(['entry', 'b', 'c'])
      const { anchorRef, firstItemRef } = useBidirectionalScroll({ safariCorrection: false })

      return (
        <>
          {items.map((id, i) => {
            const isEntry = id === 'entry'
            const isFirst = i === 0
            return (
              <div
                key={id}
                ref={
                  isEntry && isFirst
                    ? el => { anchorRef(el); firstItemRef(el) }
                    : isEntry
                      ? anchorRef
                      : isFirst
                        ? firstItemRef
                        : undefined
                }
                data-testid={id}
              >
                {id}
              </div>
            )
          })}
          <button
            data-testid="prepend"
            onClick={() => setItems(prev => ['new', ...prev])}
          >
            prepend
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)

    // anchorRef → 초기 scrollIntoView
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)

    // 프리펜드: firstItemRef 이동 → 이전 첫 번째('entry')로 앵커링
    act(() => getByTestId('prepend').click())

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('unmount 시 pending rAF cleanup', () => {
    function Test() {
      const { anchorRef } = useBidirectionalScroll({ safariCorrection: true })
      return <div ref={anchorRef}>entry</div>
    }

    const { unmount } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)

    unmount()

    vi.advanceTimersByTime(32)
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })
})
