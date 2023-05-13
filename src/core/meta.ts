import z from 'zod'

import { NotFoundError } from '~/core/errors'

import { CollectionConfig, DatabaseOptions, Store } from './types'

const VERSION_ID = 'version'
const versionSchema = z.object({
  version: z.number(),
})

const COLLECTION_NAME = '__meta__'
const SCHEMA = z.object({
  id: z.string(),
  data: versionSchema,
})
export type MetaEntry = z.infer<typeof SCHEMA>

const metaCollectionConfig: CollectionConfig = {
  primaryKey: 'id',
  schema: SCHEMA,
}

export const extendWithMetaCollection = <O extends DatabaseOptions>(
  options: O
): O => {
  return {
    ...options,
    collections: {
      ...options.collections,
      [COLLECTION_NAME]: metaCollectionConfig,
    },
  }
}

export const getVersion = (store: Store) => {
  return store
    .get(COLLECTION_NAME, VERSION_ID)
    .then((entry) => (entry as MetaEntry)?.data.version)
    .catch((err) => {
      if (err instanceof NotFoundError) {
        return 0
      }
      throw err
    })
}

export const setVersion = (store: Store, version: number) => {
  return store.set(COLLECTION_NAME, VERSION_ID, { version })
}
