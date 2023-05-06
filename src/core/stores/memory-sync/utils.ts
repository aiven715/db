import { DatabaseOptions, Entry, Store } from '../../types'

export const fetchInitialData = async (
  options: DatabaseOptions,
  persistentStore: Store
): Promise<Record<string, Entry[]>> => {
  const collections = Object.keys(options.collections)
  const data: Record<string, Entry[]> = {}
  await Promise.all(
    collections.map(async (collection) => {
      data[collection] = await persistentStore.list(collection)
    })
  )
  return data
}
