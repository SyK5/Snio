export interface Paged<T> {
  items: T[]
  nextCursor: string | null
}

export async function cursorPage<Row, View extends { id: string }>(
  limit: number,
  query: (take: number) => Promise<Row[]>,
  toView: (row: Row) => View,
): Promise<Paged<View>> {
  const rows = await query(limit + 1)
  const items = rows.slice(0, limit).map(toView)
  return { items, nextCursor: rows.length > limit ? (items[items.length - 1]?.id ?? null) : null }
}
