import Loki from 'lokijs'

import { DatabaseOptions } from '~/core/types'

export const createLokiInstance = (
  options: DatabaseOptions,
  lokiOptions?: Partial<LokiConfigOptions>
): Promise<Loki> =>
  new Promise((resolve) => {
    const loki = new Loki(`${options.name}.db`, {
      autoload: true,
      throttledSaves: true,
      autoloadCallback: () => {
        for (const collection in options.collections) {
          const config = options.collections[collection]
          const exists = loki.getCollection(collection)
          if (!exists) {
            loki.addCollection(collection, {
              unique: [config.primaryKey],
              indices: config.indexes,
            })
          }
        }
        resolve(loki)
      },
      ...lokiOptions,
    })
  })
