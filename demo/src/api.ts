const DUMMY_PRODUCTS_API = 'https://dummyjson.com/products'
const PRODUCT_FIELDS = 'id,title,thumbnail'

export interface Item {
  id: string
  numericId: number
  imageUrl: string
  title: string
}

export interface PageInfo {
  startCursor: number | null
  endCursor: number | null
  hasPreviousPage: boolean
  hasNextPage: boolean
}

interface RemoteProductsResponse {
  products: Array<{
    id: number
    title: string
    thumbnail: string
  }>
  total: number
}

function buildItems(total = 194): Item[] {
  return Array.from({ length: total }, (_, i) => {
    const id = i + 1
    return {
      id: `item-${id}`,
      numericId: id,
      imageUrl: `https://picsum.photos/seed/item${id}/400/400`,
      title: `Mock item ${id}`,
    }
  })
}

const ALL_ITEMS = buildItems()
let allItemsPromise: Promise<Item[]> | null = null
let totalCountPromise: Promise<number> | null = null

function toItems(products: RemoteProductsResponse['products']): Item[] {
  return products.map(product => ({
    id: `item-${product.id}`,
    numericId: product.id,
    imageUrl: product.thumbnail,
    title: product.title,
  }))
}

async function fetchRemoteItems(skip: number, limit: number): Promise<RemoteProductsResponse> {
  const query = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
    select: PRODUCT_FIELDS,
  })

  const res = await fetch(`${DUMMY_PRODUCTS_API}?${query.toString()}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)

  return res.json() as Promise<RemoteProductsResponse>
}

async function getTotalCount(): Promise<number> {
  if (!totalCountPromise) {
    totalCountPromise = fetchRemoteItems(0, 1)
      .then(data => data.total)
      .catch(() => ALL_ITEMS.length)
  }

  return totalCountPromise
}

async function getAllItems(): Promise<Item[]> {
  if (!allItemsPromise) {
    allItemsPromise = fetchRemoteItems(0, 0)
      .then(data => toItems(data.products))
      .catch(() => ALL_ITEMS)
  }

  return allItemsPromise
}

function clampEntryIndex(entryId: number, total: number) {
  return Math.min(Math.max(entryId - 1, 0), Math.max(total - 1, 0))
}

function buildPageInfo(items: Item[], startIndex: number, endIndex: number, total: number): PageInfo {
  return {
    startCursor: items.length > 0 ? items[0].numericId : null,
    endCursor: items.length > 0 ? items[items.length - 1].numericId : null,
    hasPreviousPage: startIndex > 0,
    hasNextPage: endIndex < total,
  }
}

async function fetchPage(skip: number, limit: number): Promise<{ items: Item[], total: number }> {
  try {
    const data = await fetchRemoteItems(skip, limit)
    return {
      items: toItems(data.products),
      total: data.total,
    }
  } catch {
    return {
      items: ALL_ITEMS.slice(skip, skip + limit),
      total: ALL_ITEMS.length,
    }
  }
}

export async function fetchAllItems(): Promise<Item[]> {
  return getAllItems()
}

export async function fetchItems(params: Record<string, string | number>): Promise<{
  items: Item[]
  pageInfo: PageInfo
}> {
  const entryId = params.entryId ? Number(params.entryId) : null
  const after = params.after ? Number(params.after) : null
  const before = params.before ? Number(params.before) : null
  const first = params.first ? Number(params.first) : null
  const last = params.last ? Number(params.last) : null

  if (entryId === null && after === null && before === null) {
    const items = await getAllItems()
    return {
      items,
      pageInfo: buildPageInfo(items, 0, items.length, items.length),
    }
  }

  const total = await getTotalCount()

  if (entryId !== null) {
    const entryIndex = clampEntryIndex(entryId, total)
    const previousCount = last ?? 3
    const nextCount = first ?? 7
    const startIndex = Math.max(0, entryIndex - previousCount)
    const endIndex = Math.min(total, entryIndex + nextCount + 1)
    const { items } = await fetchPage(startIndex, endIndex - startIndex)

    return {
      items,
      pageInfo: buildPageInfo(items, startIndex, endIndex, total),
    }
  }

  if (after !== null && first) {
    const startIndex = Math.min(total, Math.max(after, 0))
    const endIndex = Math.min(total, startIndex + first)
    const { items } = await fetchPage(startIndex, endIndex - startIndex)

    return {
      items,
      pageInfo: buildPageInfo(items, startIndex, endIndex, total),
    }
  }

  if (before !== null && last) {
    const endIndex = Math.max(0, before - 1)
    const startIndex = Math.max(0, endIndex - last)
    const { items } = await fetchPage(startIndex, endIndex - startIndex)

    return {
      items,
      pageInfo: buildPageInfo(items, startIndex, endIndex, total),
    }
  }

  return {
    items: [],
    pageInfo: {
      startCursor: null,
      endCursor: null,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  }
}
