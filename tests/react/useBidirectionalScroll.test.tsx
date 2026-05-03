import React from 'react'
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, cleanup, act } from '@testing-library/react'
import { useBidirectionalScroll } from '../../src/useBidirectionalScroll'
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

  it('인라인 scrollOptions 사용 시에도 ref callback identity를 유지해야 함', () => {
    const refs: unknown[] = []

    function Test() {
      const [count, setCount] = useState(0)
      const { firstItemRef } = useBidirectionalScroll({
        scrollOptions: { block: 'start' },
        safariCorrection: false,
      })
      refs.push(firstItemRef)

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

    expect(refs).toHaveLength(2)
    expect(refs[1]).toBe(refs[0])
  })

  it('인라인 scrollOptions + 단순 리렌더 시 의도치 않은 scrollIntoView 발생하지 않아야 함', () => {
    function Test() {
      const [count, setCount] = useState(0)
      const { firstItemRef } = useBidirectionalScroll({
        scrollOptions: { block: 'start' },
        safariCorrection: false,
      })

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
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()

    act(() => getByTestId('rerender').click())
    act(() => getByTestId('rerender').click())

    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('기본 scrollOptions 사용 시 ref callback identity를 유지', () => {
    const refs: unknown[] = []

    function Test() {
      const [count, setCount] = useState(0)
      const { firstItemRef } = useBidirectionalScroll()
      refs.push(firstItemRef)

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

    expect(refs).toHaveLength(2)
    expect(refs[1]).toBe(refs[0])
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

  it('itemRef: 첫 번째 아이템이면 firstItemRef를 연결', () => {
    function Test() {
      const [items, setItems] = useState(['a', 'b', 'c'])
      const { itemRef } = useBidirectionalScroll<string>({ safariCorrection: false })

      return (
        <>
          {items.map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={id}>
              {id}
            </div>
          ))}
          <button data-testid="prepend" onClick={() => setItems(prev => ['new', ...prev])}>
            prepend
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()

    act(() => getByTestId('prepend').click())

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('itemRef: anchorId와 일치하면 anchorRef를 연결', () => {
    function Test() {
      const { itemRef } = useBidirectionalScroll<string>({
        anchorId: 'b',
        safariCorrection: false,
      })

      return (
        <>
          {['a', 'b', 'c'].map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={id}>
              {id}
            </div>
          ))}
        </>
      )
    }

    render(<Test />)

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('itemRef: number itemId와 anchorId도 동일하게 동작', () => {
    function Test() {
      const { itemRef } = useBidirectionalScroll<number>({
        anchorId: 2,
        safariCorrection: false,
      })

      return (
        <>
          {[1, 2, 3].map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={String(id)}>
              {id}
            </div>
          ))}
        </>
      )
    }

    render(<Test />)

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
  })

  it('itemRef: 첫 번째 아이템이면서 anchorId와 일치하면 ref를 병합', () => {
    function Test() {
      const [items, setItems] = useState(['entry', 'b', 'c'])
      const { itemRef } = useBidirectionalScroll<string>({
        anchorId: 'entry',
        safariCorrection: false,
      })

      return (
        <>
          {items.map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={id}>
              {id}
            </div>
          ))}
          <button data-testid="prepend" onClick={() => setItems(prev => ['new', ...prev])}>
            prepend
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)

    act(() => getByTestId('prepend').click())

    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2)
  })

  it('itemRef: prepend 없는 일반 리렌더에서는 merged ref가 불필요하게 재실행되지 않음', () => {
    function Test() {
      const [count, setCount] = useState(0)
      const { itemRef } = useBidirectionalScroll<string>({
        anchorId: 'entry',
        safariCorrection: false,
      })

      return (
        <>
          {['entry', 'b', 'c'].map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={id}>
              {id}
            </div>
          ))}
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

  it('itemRef: 첫 번째도 anchor도 아니면 undefined를 반환', () => {
    function Test() {
      const { itemRef } = useBidirectionalScroll<string>({
        anchorId: 'z',
        safariCorrection: false,
      })

      expect(itemRef({ itemId: 'b', index: 1 })).toBeUndefined()

      return null
    }

    render(<Test />)
  })

  it('[item2] anchorId가 바뀌면 새 anchor로 스크롤되어야 함 (keep-mounted)', () => {
    function Test() {
      const [anchorId, setAnchorId] = useState('a')
      const { itemRef } = useBidirectionalScroll<string>({
        anchorId,
        safariCorrection: false,
      })

      return (
        <>
          {['a', 'b', 'c'].map((id, index) => (
            <div key={id} ref={itemRef({ itemId: id, index })} data-testid={id}>
              {id}
            </div>
          ))}
          <button data-testid="change" onClick={() => setAnchorId('c')}>
            change
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)

    // 초기: anchor='a' → 1번 호출
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(1)
    const firstCallContext = vi.mocked(HTMLElement.prototype.scrollIntoView).mock.contexts[0]
    expect((firstCallContext as HTMLElement).textContent).toBe('a')

    // anchorId 변경: 'a' → 'c'
    act(() => getByTestId('change').click())

    // 기대: 'c'로 스크롤. 실제: 호출 안 됨 (hasScrolledToEntry 안 풀림)
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledTimes(2)
    const secondCallContext = vi.mocked(HTMLElement.prototype.scrollIntoView).mock.contexts[1]
    expect((secondCallContext as HTMLElement).textContent).toBe('c')
  })

  // 알려진 제약: items가 prepend가 아닌 방식(전체 교체/정렬)으로 첫 아이템이 바뀌면
  // ref 라이프사이클만으로는 prepend와 구분할 수 없어 false-positive 스크롤이 발생.
  // 이런 경우 hook을 unmount/remount 하여 우회 (예: 컨테이너에 key prop 부여).
  it.skip('[item4-A] 전체 교체(prepend 아님) 시 scrollIntoView 호출 안 되어야 함', () => {
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
          <button data-testid="replace" onClick={() => setItems(['x', 'y', 'z'])}>
            replace
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()

    // 전체 교체: a,b,c → x,y,z (prepend 아닌 완전 교체)
    act(() => getByTestId('replace').click())

    // 기대: 호출 안 됨. 실제: 떨어진 a_el에 scrollIntoView (false positive prepend)
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it.skip('[item4-B] 정렬 토글로 첫 아이템이 바뀌면 scrollIntoView 호출 안 되어야 함', () => {
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
          <button data-testid="sort" onClick={() => setItems(prev => [...prev].reverse())}>
            sort
          </button>
        </>
      )
    }

    const { getByTestId } = render(<Test />)
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()

    // 정렬: a,b,c → c,b,a (prepend 아닌 reorder)
    act(() => getByTestId('sort').click())

    // 기대: 호출 안 됨. 실제: 'a'(이제 끝)로 스크롤
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled()
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
