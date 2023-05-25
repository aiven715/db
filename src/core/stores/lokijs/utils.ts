import Loki from 'lokijs'

import { CollectionConfig, DatabaseOptions } from '~/core/types'

import { LokiJSStoreOptions } from './index'

export const createLokiDb = (
  options: DatabaseOptions,
  storeOptions?: LokiJSStoreOptions
): Promise<Loki> =>
  new Promise((resolve) => {
    const loki = new Loki(`${options.name}.db`, {
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
      ...storeOptions?.lokiOptions,
    })
  })

export const getLokiCollectionName = (
  collection: string,
  config: CollectionConfig
) => {
  const migrations = config.migrations || []
  return `${collection}-${migrations.length}`
}
