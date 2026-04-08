# bidirectional-infinite-scroll

`scrollIntoView` 기반의 경량 양방향 무한스크롤.

web API(`IntersectionObserver`, `scrollIntoView`)만으로 동작합니다. prepend 후 위치 유지와 Safari/iOS 보정을 기본으로 제공해서, scroll listener와 수동 `scrollTop` 보정 코드를 직접 관리하고 싶지 않을 때 쓰기 좋습니다. React에서는 `useBidirectionalScroll`, Vanilla JS에서는 `bidirectionalScroll`를 중심으로 사용하면 됩니다. `FetchMore`는 선택적인 helper입니다.

[English README](./README.md)

## 설치

```bash
npm install @ahnandev/bidirectional-infinite-scroll
```

React 지원은 `16.14.0`, `17.0.2`, `18.3.1`, `19.2.0` 기준으로 smoke test 했습니다.

```bash
npm run test:react-matrix
npm run demo:react -- 16
```

## React

```tsx
import { FetchMore, useBidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll/react'

function Feed({ items, entryId, hasPreviousPage, hasNextPage, loadPrevious, loadNext }) {
  const { anchorRef, firstItemRef } = useBidirectionalScroll()

  return (
    <div>
      <FetchMore hasMore={hasPreviousPage} onIntersect={loadPrevious} />

      {items.map((item, i) => (
        <div
          key={item.id}
          ref={i === 0 ? firstItemRef : item.id === entryId ? anchorRef : undefined}
        >
          {item.title}
        </div>
      ))}

      <FetchMore hasMore={hasNextPage} onIntersect={loadNext} />
    </div>
  )
}
```

- `anchorRef`: 진입 아이템에 붙입니다.
- `firstItemRef`: 현재 첫 아이템에 붙입니다.
- 진입 아이템이 첫 번째 아이템과 같다면 두 ref를 함께 붙입니다.
- `FetchMore`는 선택 사항입니다. 같은 역할의 `IntersectionObserver` 트리거를 직접 만들어도 됩니다.

## Vanilla JS

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

- `entryAnchor`: 처음 진입할 요소를 지정합니다.
- `onLoadPrevious`: 위쪽에 아이템을 prepend 합니다. 이전 첫 콘텐츠 아이템 기준 재앵커링은 자동입니다.
- `onLoadNext`: 아래쪽에 아이템을 append 합니다.

## 라이선스

MIT
