import { useCallback, useEffect, useRef, useState } from 'react'
import { FetchMore, useBidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll/react'

// --- 타입 ---
interface FeedItem {
  id: string
  numericId: number
  imageUrl: string
}

interface PageInfo {
  startCursor: number | null
  endCursor: number | null
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface FeedResponse {
  items: FeedItem[]
  pageInfo: PageInfo
}

// --- API ---
const API_BASE = 'https://dummyjson.com/products?limit=0&select=id,title,thumbnail'
const ENTRY_ID = 30
const PAGE_SIZE = 5
let allItemsPromise: Promise<FeedItem[]> | null = null

async function fetchAllItems(): Promise<FeedItem[]> {
  if (!allItemsPromise) {
    allItemsPromise = fetch(API_BASE)
      .then(async res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json() as {
          products: Array<{ id: number, thumbnail: string }>
        }
        return data.products.map(product => ({
          id: `item-${product.id}`,
          numericId: product.id,
          imageUrl: product.thumbnail,
        }))
      })
  }

  return allItemsPromise
}

function resolveItems(
  allItems: FeedItem[],
  params: Record<string, string | number>,
): FeedResponse {
  const entryId = params.entryId ? Number(params.entryId) : null
  const after = params.after ? Number(params.after) : null
  const before = params.before ? Number(params.before) : null
  const first = params.first ? Number(params.first) : null
  const last = params.last ? Number(params.last) : null

  let items: FeedItem[] = []
  let startIndex = 0
  let endIndex = allItems.length

  if (entryId === null && after === null && before === null) {
    items = allItems
  } else if (entryId !== null) {
    const entryIndex = allItems.findIndex(item => item.numericId === entryId)
    if (entryIndex === -1) throw new Error(`entryId ${entryId} not found`)
    startIndex = Math.max(0, entryIndex - (last ?? 3))
    endIndex = Math.min(allItems.length, entryIndex + (first ?? 7) + 1)
    items = allItems.slice(startIndex, endIndex)
  } else if (after !== null && first) {
    const afterIndex = allItems.findIndex(item => item.numericId === after)
    if (afterIndex === -1) throw new Error(`cursor ${after} not found`)
    startIndex = afterIndex + 1
    endIndex = Math.min(allItems.length, startIndex + first)
    items = allItems.slice(startIndex, endIndex)
  } else if (before !== null && last) {
    const beforeIndex = allItems.findIndex(item => item.numericId === before)
    if (beforeIndex === -1) throw new Error(`cursor ${before} not found`)
    endIndex = beforeIndex
    startIndex = Math.max(0, endIndex - last)
    items = allItems.slice(startIndex, endIndex)
  } else {
    throw new Error('entryId, after+first, 또는 before+last 필요')
  }

  return {
    items,
    pageInfo: {
      startCursor: items.length > 0 ? items[0].numericId : null,
      endCursor: items.length > 0 ? items[items.length - 1].numericId : null,
      hasPreviousPage: startIndex > 0,
      hasNextPage: endIndex < allItems.length,
    },
  }
}

async function fetchItems(params: Record<string, string | number>): Promise<FeedResponse> {
  const allItems = await fetchAllItems()
  return resolveItems(allItems, params)
}

// --- 메인 컴포넌트 ---
export default function App() {
  const [items, setItems] = useState<FeedItem[]>([])
  const [pageInfo, setPageInfo] = useState<PageInfo>({
    startCursor: null,
    endCursor: null,
    hasPreviousPage: false,
    hasNextPage: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialLoaded = useRef(false)

  const { anchorRef, firstItemRef } = useBidirectionalScroll()

  // 초기 로드
  useEffect(() => {
    if (initialLoaded.current) return
    initialLoaded.current = true

    fetchItems({ entryId: ENTRY_ID, first: 7, last: 3 })
      .then(data => {
        setItems(data.items)
        setPageInfo(data.pageInfo)
      })
      .catch(e => setError(e.message))
  }, [])

  // 이전 페이지 로드
  const loadPrevious = useCallback(async () => {
    if (loading || !pageInfo.startCursor) return
    setLoading(true)
    setError(null)

    try {
      const data = await fetchItems({ before: pageInfo.startCursor, last: PAGE_SIZE })
      setItems(prev => [...data.items, ...prev])
      setPageInfo(prev => ({
        ...prev,
        startCursor: data.pageInfo.startCursor,
        hasPreviousPage: data.pageInfo.hasPreviousPage,
      }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [loading, pageInfo.startCursor])

  // 다음 페이지 로드
  const loadNext = useCallback(async () => {
    if (loading || !pageInfo.endCursor) return
    setLoading(true)
    setError(null)

    try {
      const data = await fetchItems({ after: pageInfo.endCursor, first: PAGE_SIZE })
      setItems(prev => [...prev, ...data.items])
      setPageInfo(prev => ({
        ...prev,
        endCursor: data.pageInfo.endCursor,
        hasNextPage: data.pageInfo.hasNextPage,
      }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [loading, pageInfo.endCursor])

  if (items.length === 0 && !error) {
    return <div style={styles.loading}>로딩 중...</div>
  }

  if (error) {
    return <div style={{ ...styles.loading, color: '#e74c3c' }}>오류: {error}</div>
  }

  return (
    <div style={styles.container}>
      {loading && pageInfo.hasPreviousPage && (
        <div style={styles.loading}>이전 아이템 불러오는 중...</div>
      )}

      <FetchMore
        hasMore={pageInfo.hasPreviousPage}
        loading={loading}
        onIntersect={loadPrevious}
        observerInit={{ rootMargin: '100px' }}
      />

      {items.map((item, i) => {
        const isEntry = item.numericId === ENTRY_ID
        const isFirst = i === 0

        return (
          <div
            key={item.id}
            ref={
              isEntry && isFirst
                ? el => { anchorRef(el); firstItemRef(el) }
                : isEntry
                  ? anchorRef
                  : isFirst
                    ? firstItemRef
                    : undefined
            }
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
            <div style={styles.cardLabel}>
              #{item.numericId}
              {isEntry && ' entry'}
            </div>
          </div>
        )
      })}

      <FetchMore
        hasMore={pageInfo.hasNextPage}
        loading={loading}
        onIntersect={loadNext}
        observerInit={{ rootMargin: '100px' }}
      />

      {loading && pageInfo.hasNextPage && (
        <div style={styles.loading}>다음 아이템 불러오는 중...</div>
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: '0 auto',
    fontFamily: '-apple-system, sans-serif',
    background: '#f5f5f5',
    minHeight: '100vh',
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
  loading: {
    textAlign: 'center',
    padding: 16,
    color: '#999',
    fontSize: 13,
  },
}
