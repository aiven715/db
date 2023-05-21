import Loki from 'lokijs'

import { CollectionConfig, DatabaseOptions, Query } from '~/core/types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export const createLokiDatabase = (options: DatabaseOptions): Promise<Loki> =>
  new Promise((resolve) => {
    const loki = new Loki(options.name, {
      adapter: new LokiIncrementalIndexedDBAdapter(),
      autoload: true,
      throttledSaves: true,
      autoloadCallback: () => {
        for (const collection in options.collections) {
          const config = options.collections[collection]
          const name = getLokiCollectionName(collection, config)
          const exists = loki.getCollection(name)
          if (!exists) {
            loki.addCollection(name, {
              unique: [config.primaryKey],
              indices: config.indexes,
            })
          }
        }
        resolve(loki)
      },
    })
  })

export const getLokiCollectionName = (
  collection: string,
  config: CollectionConfig
) => {
  const migrations = config.migrations || []
  return `${collection}-${migrations.length}`
}

export const createLokiQuery = (query?: Query) => {
  return {
    ...(query?.filter || {}),
    _deleted: false,
  }
}
