import { useEffect, useState } from 'react'
import { fetchAllItems, type Item } from './api'

interface Props {
  onSelect: (id: number) => void
}

export function GridView({ onSelect }: Props) {
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    fetchAllItems().then(setItems)
  }, [])

  if (items.length === 0) {
    return <div style={styles.loader}>loading...</div>
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.caption}>Choose an entry item from the grid below.</div>
      <div style={styles.grid}>
        {items.map(item => (
          <button
            key={item.id}
            style={styles.cell}
            onClick={() => onSelect(item.numericId)}
          >
            <img
              src={item.imageUrl}
              alt={String(item.numericId)}
              style={styles.image}
              loading="lazy"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    padding: '12px 12px 24px',
  },
  caption: {
    marginBottom: 12,
    fontSize: 13,
    color: '#57534e',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 6,
  },
  cell: {
    aspectRatio: '1',
    border: '1px solid rgba(28, 25, 23, 0.08)',
    borderRadius: 14,
    padding: 0,
    cursor: 'pointer',
    overflow: 'hidden',
    background: '#e0e0e0',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  loader: {
    textAlign: 'center',
    padding: 40,
    color: '#999',
  },
}
