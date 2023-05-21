import Loki from 'lokijs'

import { CollectionConfig, DatabaseOptions, Query } from '~/core/types'

export const createLokiDatabase = (
  options: DatabaseOptions,
  adapter?: LokiPersistenceAdapter
): Promise<Loki> =>
  new Promise((resolve) => {
    const loki = new Loki(options.name, {
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
      ...(adapter && { adapter }),
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
    // FIXME: specific to RxDB
    // RxDB will have RxDBLokiJSStore which wraps LokiJSStore and adds
    // a _deleted field to the query filter and to the document itself
    // so that it can be used to soft-delete documents.
    _deleted: false,
  }
}
