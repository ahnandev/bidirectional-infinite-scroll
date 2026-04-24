import { useEffect, useRef, useState } from 'react'
import { bidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll'
import { fetchItems, type Item } from './api'

const PAGE_SIZE = 5

interface Props {
  entryId: number
  onBack: () => void
}

function renderCard(item: Item, entryId: number) {
  const card = document.createElement('div')
  const isEntry = item.numericId === entryId
  card.className = 'vanilla-card'
  card.id = item.id
  card.style.background = '#fff'
  card.style.margin = '8px 0'
  card.style.overflow = 'hidden'
  card.style.position = 'relative'

  if (isEntry) {
    card.style.boxShadow = 'inset 4px 0 0 #03c75a'
  }

  const image = document.createElement('img')
  image.src = item.imageUrl
  image.alt = String(item.numericId)
  image.loading = 'lazy'
  image.style.width = '100%'
  image.style.aspectRatio = '4 / 3'
  image.style.objectFit = 'cover'
  image.style.display = 'block'

  const label = document.createElement('div')
  label.textContent = isEntry ? `#${item.numericId} entry` : `#${item.numericId}`
  label.style.position = 'absolute'
  label.style.top = '12px'
  label.style.left = '12px'
  label.style.background = 'rgba(0,0,0,0.5)'
  label.style.color = '#fff'
  label.style.padding = '4px 10px'
  label.style.borderRadius = '4px'
  label.style.fontSize = '13px'

  card.append(image, label)
  return card
}

function renderLoader(text: string) {
  const el = document.createElement('div')
  el.textContent = text
  el.style.textAlign = 'center'
  el.style.padding = '20px'
  el.style.color = '#999'
  el.style.fontSize = '14px'
  return el
}

export function VanillaFeedView({ entryId, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let destroyed = false
    let destroyScroll: (() => void) | undefined
    let startCursor: number | null = null
    let endCursor: number | null = null
    let hasPrevious = false
    let hasNext = false
    let loading = false

    container.innerHTML = ''
    setStatus('loading')
    setError(null)

    const mountInitial = async () => {
      try {
        const initial = await fetchItems({ entryId, first: 7, last: 3 })
        if (destroyed) return

        startCursor = initial.pageInfo.startCursor
        endCursor = initial.pageInfo.endCursor
        hasPrevious = initial.pageInfo.hasPreviousPage
        hasNext = initial.pageInfo.hasNextPage

        initial.items.forEach(item => container.appendChild(renderCard(item, entryId)))

        const scroll = bidirectionalScroll({
          container,
          entryAnchor: `#item-${entryId}`,
          onLoadPrevious: async () => {
            if (loading || !hasPrevious || startCursor === null) return
            loading = true

            const loader = renderLoader('loading...')
            const trigger = container.querySelector('[data-bidir-scroll-trigger="before"]')
            container.insertBefore(loader, trigger?.nextSibling ?? container.firstChild)

            try {
              const data = await fetchItems({ before: startCursor, last: PAGE_SIZE })
              if (destroyed) return

              loader.remove()
              const topTrigger = container.querySelector('[data-bidir-scroll-trigger="before"]')
              const insertRef = topTrigger?.nextSibling ?? container.firstChild

              data.items.forEach(item => {
                container.insertBefore(renderCard(item, entryId), insertRef)
              })

              startCursor = data.pageInfo.startCursor
              hasPrevious = data.pageInfo.hasPreviousPage
            } catch (e) {
              loader.textContent = 'load failed'
              console.error(e)
            } finally {
              loading = false
            }
          },
          onLoadNext: async () => {
            if (loading || !hasNext || endCursor === null) return
            loading = true

            const loader = renderLoader('loading...')
            const trigger = container.querySelector('[data-bidir-scroll-trigger="after"]')
            container.insertBefore(loader, trigger ?? null)

            try {
              const data = await fetchItems({ after: endCursor, first: PAGE_SIZE })
              if (destroyed) return

              loader.remove()
              const bottomTrigger = container.querySelector('[data-bidir-scroll-trigger="after"]')

              data.items.forEach(item => {
                container.insertBefore(renderCard(item, entryId), bottomTrigger ?? null)
              })

              endCursor = data.pageInfo.endCursor
              hasNext = data.pageInfo.hasNextPage
            } catch (e) {
              loader.textContent = 'load failed'
              console.error(e)
            } finally {
              loading = false
            }
          },
          observerInit: { rootMargin: '200px' },
        })
        destroyScroll = () => scroll.destroy()

        setStatus('ready')
      } catch (e) {
        if (destroyed) return
        setError((e as Error).message)
        setStatus('error')
      }
    }

    void mountInitial()

    return () => {
      destroyed = true
      destroyScroll?.()
      container.innerHTML = ''
    }
  }, [entryId])

  return (
    <div style={styles.container}>
      <div style={styles.body}>
        {status === 'loading' && <div style={styles.loader}>loading...</div>}
        {status === 'error' && <div style={styles.error}>error: {error}</div>}
        <div ref={containerRef} style={styles.feed} />
      </div>

      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>
          ← grid
        </button>
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
  },
  header: {
    position: 'sticky',
    bottom: 0,
    zIndex: 10,
    padding: '12px 16px',
    background: 'rgba(28,25,23,0.94)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 12,
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
  loader: {
    textAlign: 'center',
    padding: 20,
    color: '#999',
    fontSize: 14,
  },
  error: {
    textAlign: 'center',
    padding: 20,
    color: '#b91c1c',
    fontSize: 14,
  },
  feed: {
    minHeight: 'calc(100vh - 140px)',
  },
}
