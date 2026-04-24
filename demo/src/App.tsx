import { useState } from 'react'
import { GridView } from './GridView'
import { FeedView } from './FeedView'

const DEFAULT_ENTRY_ID = 100

export default function App() {
  const [selectedId, setSelectedId] = useState(DEFAULT_ENTRY_ID)
  const [showGrid, setShowGrid] = useState(false)

  const openFeed = (id: number) => {
    setSelectedId(id)
    setShowGrid(false)
    window.scrollTo(0, 0)
  }

  const openGrid = () => {
    setShowGrid(true)
  }

  return (
    <div style={styles.app}>
      {showGrid && (
        <div style={styles.hero}>
          <div style={styles.eyebrow}>bidirectional-infinite-scroll demo</div>
          <h1 style={styles.title}>Grid to Feed</h1>
          <p style={styles.copy}>
            Pick an item from the grid to enter the React demo.
          </p>
        </div>
      )}

      <div style={{ display: showGrid ? 'block' : 'none' }}>
        <GridView onSelect={openFeed} />
      </div>
      {!showGrid && (
        <FeedView
          entryId={selectedId}
          onBack={openGrid}
        />
      )}
    </div>
  )
}

const styles = {
  app: {
    maxWidth: 480,
    margin: '0 auto',
    minHeight: '100vh',
    background: '#f3efe7',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } satisfies React.CSSProperties,
  hero: {
    padding: '20px 16px 16px',
    background:
      'linear-gradient(180deg, rgba(248,244,235,1) 0%, rgba(243,239,231,0.88) 100%)',
    borderBottom: '1px solid rgba(33, 37, 41, 0.08)',
  } satisfies React.CSSProperties,
  eyebrow: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#8b5e34',
    marginBottom: 6,
  } satisfies React.CSSProperties,
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1,
    color: '#1c1917',
  } satisfies React.CSSProperties,
  copy: {
    margin: '10px 0 14px',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#57534e',
  } satisfies React.CSSProperties,
}
