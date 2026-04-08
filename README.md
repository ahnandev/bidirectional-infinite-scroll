# bidirectional-infinite-scroll

Lightweight bidirectional infinite scroll built on `scrollIntoView`.

It uses standard web APIs such as `IntersectionObserver` and `scrollIntoView` instead of scroll listeners and manual `scrollTop` correction. For React, use `useBidirectionalScroll`. For vanilla DOM usage, use `bidirectionalScroll`. `FetchMore` is an optional helper component.

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

`useBidirectionalScroll`: React hook for bidirectional infinite scroll.

- `itemRef({ itemId, index })`: pass each item's id and index to the rendered item.
- optional) `anchorId`: use this when you want the list to start from a specific item.
- optional) `scrollOptions`: custom `scrollIntoView` options. Defaults to `{ behavior: 'instant', block: 'start' }`.
- optional) `safariCorrection`: enables double-rAF correction to reduce Safari layout shift. Defaults to `true`.
- optional) `FetchMore`: helper component. You can provide your own `IntersectionObserver` trigger if you prefer.
- optional) `anchorRef` and `firstItemRef`: low-level refs for manual control.

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

`bidirectionalScroll`: core vanilla JS function.

- `container`: scroll container element.
- `onLoadPrevious` / `onLoadNext`: load-more callbacks.
- optional) `entryAnchor`: use this when you want the list to start from a specific item.
- optional) `observerInit`: `IntersectionObserver` options for the load triggers.
- optional) `scrollOptions`: custom `scrollIntoView` options.
- optional) `overscrollBehavior`: applies `overscroll-behavior` to the container.
- optional) `safariCorrection`: enables double-rAF correction to reduce Safari layout shift. Defaults to `true`.

## License

MIT
