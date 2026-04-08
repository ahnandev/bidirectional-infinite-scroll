import { useRef, useState } from 'react'
import { GridView } from './GridView'
import { FeedView } from './FeedView'
import { VanillaFeedView } from './VanillaFeedView'

type DemoMode = 'react' | 'vanilla'
const DEFAULT_ENTRY_ID = 100

export default function App() {
  const [selectedId, setSelectedId] = useState(DEFAULT_ENTRY_ID)
  const [showGrid, setShowGrid] = useState(false)
  const [mode, setMode] = useState<DemoMode>('react')
  const gridScrollY = useRef(0)

  const openFeed = (id: number) => {
    gridScrollY.current = window.scrollY
    setSelectedId(id)
    setShowGrid(false)
    window.scrollTo(0, 0)
  }

  const openGrid = () => {
    gridScrollY.current = window.scrollY
    setShowGrid(true)
  }

  return (
    <div style={styles.app}>
      {showGrid && (
        <div style={styles.hero}>
          <div style={styles.eyebrow}>bidirectional-infinite-scroll demo</div>
          <h1 style={styles.title}>Grid to Feed</h1>
          <p style={styles.copy}>
            Pick an item from the grid, then compare the same bidirectional list behavior in
            React and Vanilla JS.
          </p>
          <div style={styles.modeRow}>
            <button
              style={{ ...styles.modeButton, ...(mode === 'react' ? styles.modeButtonActive : {}) }}
              onClick={() => setMode('react')}
            >
              React
            </button>
            <button
              style={{ ...styles.modeButton, ...(mode === 'vanilla' ? styles.modeButtonActive : {}) }}
              onClick={() => setMode('vanilla')}
            >
              Vanilla JS
            </button>
          </div>
          <div style={styles.copy}>
            Starts from entry <strong>#{selectedId}</strong> so the list behavior is visible right
            away.
          </div>
        </div>
      )}

      <div style={{ display: showGrid ? 'block' : 'none' }}>
        <GridView onSelect={openFeed} />
      </div>
      {!showGrid && mode === 'react' && (
        <FeedView
          entryId={selectedId}
          onBack={openGrid}
          onToggleMode={() => setMode('vanilla')}
        />
      )}
      {!showGrid && mode === 'vanilla' && (
        <VanillaFeedView
          entryId={selectedId}
          onBack={openGrid}
          onToggleMode={() => setMode('react')}
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
  modeRow: {
    display: 'flex',
    gap: 8,
    marginBottom: 10,
  } satisfies React.CSSProperties,
  modeButton: {
    border: '1px solid rgba(28, 25, 23, 0.12)',
    background: 'rgba(255,255,255,0.72)',
    color: '#44403c',
    borderRadius: 999,
    padding: '8px 14px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  } satisfies React.CSSProperties,
  modeButtonActive: {
    background: '#1c1917',
    color: '#fafaf9',
    borderColor: '#1c1917',
  } satisfies React.CSSProperties,
}
