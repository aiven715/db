import z from 'zod'

import { NotFoundError } from '~/core/errors'

import { CollectionConfig, DatabaseOptions, Store } from './types'

// TODO: have "meta" helper function which takes store and provides a simple interface
// working with meta collection as a singleton

// TODO: store ids of deleted documents for the sync

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
  const handleDefault = (err: unknown) => {
    if (err instanceof NotFoundError) {
      return 0
    }
    throw err
  }

  // TODO: remove try/catch once we'll implement catching
  // errors in sync Box
  try {
    return store
      .get(COLLECTION_NAME, VERSION_ID)
      .then((entry) => (entry as MetaEntry)?.data.version)
      .catch(handleDefault)
  } catch (err) {
    return handleDefault(err)
  }
}

export const setVersion = (store: Store, version: number) => {
  return store.update(COLLECTION_NAME, VERSION_ID, { version })
}
