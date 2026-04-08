# bidirectional-infinite-scroll

Lightweight bidirectional infinite scroll built on `scrollIntoView`.

It uses standard web APIs such as `IntersectionObserver` and `scrollIntoView` instead of scroll listeners and manual `scrollTop` correction. The library handles prepend anchoring by default and includes Safari/iOS correction for `scrollIntoView` layout shifts. For React, use `useBidirectionalScroll`. For vanilla DOM usage, use `bidirectionalScroll`. `FetchMore` is an optional helper component.

[한국어 문서](./README.ko.md)

## Install

```bash
npm install @ahnandev/bidirectional-infinite-scroll
```

Live demo: [ahnandev.github.io/bidirectional-infinite-scroll](https://ahnandev.github.io/bidirectional-infinite-scroll/)

React support is smoke-tested against `16.14.0`, `17.0.2`, `18.3.1`, and `19.2.0`.

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

- `anchorRef`: attach this to the entry item.
- `firstItemRef`: attach this to the current first item.
- If the entry item is also the first item, attach both refs to the same element.
- `FetchMore` is optional. You can provide your own `IntersectionObserver` trigger if you prefer.

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

- `entryAnchor`: specifies the element to scroll to on initial entry.
- `onLoadPrevious`: prepend items above the current list. Re-anchoring to the previous first content item is automatic.
- `onLoadNext`: append items below the current list.

## License

MIT
