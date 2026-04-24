import { useCallback, useEffect, useState } from 'react'
import { FetchMore, useBidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll'
import { fetchItems, type Item, type PageInfo } from './api'

const PAGE_SIZE = 5

interface Props {
  entryId: number
  onBack: () => void
}

export function FeedView({ entryId, onBack }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    startCursor: null, endCursor: null,
    hasPreviousPage: false, hasNextPage: false,
  })
  const [loading, setLoading] = useState(false)

  const { itemRef } = useBidirectionalScroll<number>({
    anchorId: entryId,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    fetchItems({ entryId, first: 7, last: 3 })
      .then(data => {
        if (cancelled) return
        setItems(data.items)
        setPageInfo(data.pageInfo)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [entryId])

  const loadPrevious = useCallback(async () => {
    if (loading || !pageInfo.startCursor) return
    setLoading(true)

    try {
      const data = await fetchItems({ before: pageInfo.startCursor, last: PAGE_SIZE })
      setItems(prev => [...data.items, ...prev])
      setPageInfo(prev => ({
        ...prev,
        startCursor: data.pageInfo.startCursor,
        hasPreviousPage: data.pageInfo.hasPreviousPage,
      }))
    } finally {
      setLoading(false)
    }
  }, [loading, pageInfo.startCursor])

  const loadNext = useCallback(async () => {
    if (loading || !pageInfo.endCursor) return
    setLoading(true)

    try {
      const data = await fetchItems({ after: pageInfo.endCursor, first: PAGE_SIZE })
      setItems(prev => [...prev, ...data.items])
      setPageInfo(prev => ({
        ...prev,
        endCursor: data.pageInfo.endCursor,
        hasNextPage: data.pageInfo.hasNextPage,
      }))
    } finally {
      setLoading(false)
    }
  }, [loading, pageInfo.endCursor])

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        {items.length === 0 ? (
          <div style={styles.loader}>loading...</div>
        ) : (
          <div style={styles.feed}>
            {loading && pageInfo.hasPreviousPage && (
              <div style={styles.loader}>loading...</div>
            )}

            <FetchMore
              hasMore={pageInfo.hasPreviousPage}
              loading={loading}
              onIntersect={loadPrevious}
              observerInit={{ rootMargin: '200px' }}
            />

            {items.map((item, i) => {
              const isEntry = item.numericId === entryId

              return (
                <div
                  key={item.id}
                  ref={itemRef({ itemId: item.numericId, index: i })}
                  style={{
                    ...styles.card,
                    ...(isEntry ? styles.entryCard : {}),
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={String(item.numericId)}
                    style={styles.cardImage}
                    loading="lazy"
                  />
                  <div style={styles.cardLabel}>{item.numericId}</div>
                </div>
              )
            })}

            <FetchMore
              hasMore={pageInfo.hasNextPage}
              loading={loading}
              onIntersect={loadNext}
              observerInit={{ rootMargin: '200px' }}
            />

            {loading && pageInfo.hasNextPage && (
              <div style={styles.loader}>loading...</div>
            )}
          </div>
        )}
      </div>

      <div style={styles.footerShell}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={onBack}>
            ← grid
          </button>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#f5f5f5',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  body: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
  },
  footerShell: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  header: {
    width: '100%',
    maxWidth: 480,
    padding: '12px 16px',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
    background: '#1c1917',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
    pointerEvents: 'auto',
  },
  backBtn: {
    border: 'none',
    background: 'none',
    fontSize: 15,
    cursor: 'pointer',
    padding: '4px 0',
    color: '#fafaf9',
    fontFamily: 'inherit',
    fontWeight: 600,
  },
  card: {
    background: '#fff',
    margin: '8px 0',
    overflow: 'hidden',
    position: 'relative',
  },
  entryCard: {
    boxShadow: 'inset 4px 0 0 #03c75a',
  },
  cardImage: {
    width: '100%',
    aspectRatio: '4 / 3',
    objectFit: 'cover',
    display: 'block',
  },
  cardLabel: {
    position: 'absolute',
    top: 12,
    left: 12,
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    padding: '4px 10px',
    borderRadius: 4,
    fontSize: 13,
  },
  loader: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontSize: 14,
  },
}
