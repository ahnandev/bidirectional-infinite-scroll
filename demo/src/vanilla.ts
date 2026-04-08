import { bidirectionalScroll } from '@ahnandev/bidirectional-infinite-scroll'
import { fetchItems, type Item } from './api'

const ENTRY_ID = 100
const PAGE_SIZE = 5

const app = document.getElementById('app')

if (!app) {
  throw new Error('Missing app element')
}

let startCursor: number | null = null
let endCursor: number | null = null
let hasPrevious = false
let hasNext = false
let loading = false

const shell = document.createElement('div')
shell.style.maxWidth = '480px'
shell.style.margin = '0 auto'
shell.style.minHeight = '100vh'
shell.style.background = '#f3efe7'
shell.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

const hero = document.createElement('div')
hero.style.padding = '20px 16px 16px'
hero.style.background = 'linear-gradient(180deg, rgba(248,244,235,1) 0%, rgba(243,239,231,0.88) 100%)'
hero.style.borderBottom = '1px solid rgba(33, 37, 41, 0.08)'
hero.innerHTML = `
  <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8b5e34;margin-bottom:6px;">
    bidirectional-infinite-scroll demo
  </div>
  <h1 style="font-size:28px;line-height:1;color:#1c1917;">Pure Vanilla JS</h1>
  <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#57534e;">
    Standalone page using the vanilla core without the React demo shell.
  </p>
`

const nav = document.createElement('div')
nav.style.padding = '12px 16px'
nav.style.background = 'rgba(28,25,23,0.94)'
nav.style.borderBottom = '1px solid rgba(255,255,255,0.08)'
nav.style.position = 'sticky'
nav.style.top = '0'
nav.style.zIndex = '10'
nav.style.backdropFilter = 'blur(12px)'

const backLink = document.createElement('a')
backLink.href = '/bidirectional-infinite-scroll/'
backLink.textContent = '← back to demo'
backLink.style.color = '#fafaf9'
backLink.style.textDecoration = 'none'
backLink.style.fontSize = '15px'
backLink.style.fontWeight = '600'
nav.appendChild(backLink)

const feed = document.createElement('div')
feed.style.minHeight = 'calc(100vh - 120px)'

function renderCard(item: Item) {
  const card = document.createElement('div')
  const isEntry = item.numericId === ENTRY_ID
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

async function mount() {
  const initial = await fetchItems({ entryId: ENTRY_ID, first: 7, last: 3 })
  startCursor = initial.pageInfo.startCursor
  endCursor = initial.pageInfo.endCursor
  hasPrevious = initial.pageInfo.hasPreviousPage
  hasNext = initial.pageInfo.hasNextPage

  initial.items.forEach(item => feed.appendChild(renderCard(item)))

  bidirectionalScroll({
    container: feed,
    entryAnchor: `#item-${ENTRY_ID}`,
    onLoadPrevious: async () => {
      if (loading || !hasPrevious || startCursor === null) return
      loading = true

      const loader = renderLoader('loading...')
      const trigger = feed.querySelector('[data-bidir-scroll-trigger="before"]')
      feed.insertBefore(loader, trigger?.nextSibling ?? feed.firstChild)

      try {
        const data = await fetchItems({ before: startCursor, last: PAGE_SIZE })
        loader.remove()

        const topTrigger = feed.querySelector('[data-bidir-scroll-trigger="before"]')
        const insertRef = topTrigger?.nextSibling ?? feed.firstChild
        data.items.forEach(item => {
          feed.insertBefore(renderCard(item), insertRef)
        })

        startCursor = data.pageInfo.startCursor
        hasPrevious = data.pageInfo.hasPreviousPage
      } catch (error) {
        loader.textContent = 'load failed'
        console.error(error)
      } finally {
        loading = false
      }
    },
    onLoadNext: async () => {
      if (loading || !hasNext || endCursor === null) return
      loading = true

      const loader = renderLoader('loading...')
      const trigger = feed.querySelector('[data-bidir-scroll-trigger="after"]')
      feed.insertBefore(loader, trigger ?? null)

      try {
        const data = await fetchItems({ after: endCursor, first: PAGE_SIZE })
        loader.remove()

        const bottomTrigger = feed.querySelector('[data-bidir-scroll-trigger="after"]')
        data.items.forEach(item => {
          feed.insertBefore(renderCard(item), bottomTrigger ?? null)
        })

        endCursor = data.pageInfo.endCursor
        hasNext = data.pageInfo.hasNextPage
      } catch (error) {
        loader.textContent = 'load failed'
        console.error(error)
      } finally {
        loading = false
      }
    },
    observerInit: { rootMargin: '200px' },
  })
}

shell.append(hero, nav, feed)
app.appendChild(shell)

void mount()
