# bidirectional-infinite-scroll

`scrollIntoView` 기반의 경량 양방향 무한스크롤.

web API(`IntersectionObserver`, `scrollIntoView`)만으로 동작합니다. scroll listener와 수동 `scrollTop` 보정 코드를 직접 관리하고 싶지 않을 때 쓰기 좋습니다. React에서는 `useBidirectionalScroll`, Vanilla JS에서는 `bidirectionalScroll`를 중심으로 사용하면 됩니다. `FetchMore`는 선택적인 helper입니다.

[English README](./README.md)

## 설치

```bash
npm install @ahnandev/bidirectional-infinite-scroll
```

Live demo: [ahnandev.github.io/bidirectional-infinite-scroll](https://ahnandev.github.io/bidirectional-infinite-scroll/)

React 지원은 `16.14.0`, `17.0.2`, `18.3.1`, `19.2.0` 기준으로 smoke test 했습니다.

```bash
npm run test:react-matrix
npm run demo:react -- 16
```

## How To Use

### React

```tsx
import { FetchMore, useBidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll/react'

function Feed({ items, anchorId, hasPreviousPage, hasNextPage, loadPrevious, loadNext }) {
  const { itemRef } = useBidirectionalScroll({
    anchorId,
  })

  return (
    <div>
      <FetchMore hasMore={hasPreviousPage} onIntersect={loadPrevious} />

      {items.map((item, index) => (
        <div
          key={item.id}
          ref={itemRef({ itemId: item.id, index })}
        >
          {item.title}
        </div>
      ))}

      <FetchMore hasMore={hasNextPage} onIntersect={loadNext} />
    </div>
  )
}
```

`useBidirectionalScroll`: React용 양방향 무한스크롤 hook입니다.

- `itemRef({ itemId, index })`: 각 렌더 아이템에 id와 index를 전달해 연결합니다.
- optional) `anchorId`: 목록을 특정 아이템 위치에서 시작하고 싶을 때 사용합니다.
- optional) `scrollOptions`: `scrollIntoView` 옵션을 덮어씁니다. 기본값은 `{ behavior: 'instant', block: 'start' }`입니다.
- optional) `safariCorrection`: Safari layout shift 방지를 위한 double-rAF 보정을 사용합니다. 기본값은 `true`입니다.
- optional) `FetchMore`: helper 컴포넌트입니다. 같은 역할의 `IntersectionObserver` 트리거를 직접 만들어도 됩니다.
- optional) `anchorRef`와 `firstItemRef`: 수동 제어용 저수준 ref입니다.

### Vanilla JS

```js
import { bidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll'

const container = document.getElementById('feed')

const scroll = bidirectionalScroll({
  container,
  entryAnchor: '#item-42',
  onLoadPrevious: async () => {
    prependOlderItems(container)
  },
  onLoadNext: async () => {
    appendNewerItems(container)
  },
  observerInit: { rootMargin: '50px' },
})

scroll.destroy()
```

`bidirectionalScroll`: core vanilla JS 함수입니다.

- `container`: 스크롤 컨테이너 element
- `onLoadPrevious` / `onLoadNext`: 더보기 호출 함수
- optional) `entryAnchor`: 목록을 특정 아이템 위치에서 시작하고 싶을 때 사용합니다.
- optional) `observerInit`: load trigger에 사용할 `IntersectionObserver` 옵션입니다.
- optional) `scrollOptions`: `scrollIntoView` 옵션을 덮어씁니다.
- optional) `overscrollBehavior`: container에 `overscroll-behavior`를 적용합니다.
- optional) `safariCorrection`: Safari layout shift 방지를 위한 double-rAF 보정을 사용합니다. 기본값은 `true`입니다.

## 라이선스

MIT
