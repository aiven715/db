import { Box } from '~/core/box'
import { NotFoundError } from '~/core/errors'
import { getLokiCollectionName } from '~/core/loaders/rxdb/utils'
import { LokiJSStore, LokiJSStoreOptions } from '~/core/stores/lokijs'
import { DatabaseOptions, Entry, Query } from '~/core/types'

import { DELETED_KEY } from '../rxdb/constants'

export type RxDBLokiJSStoreOptions = LokiJSStoreOptions & {
  loki: Loki
}

export class RxDBLokiJSStore extends LokiJSStore {
  list(collection: string, query?: Query) {
    return super.list(collection, {
      ...query,
      filter: { ...query?.filter, [DELETED_KEY]: false },
    })
  }

  get(collection: string, identifier: string) {
    return super.get(collection, identifier).then((entry) => {
      if (entry[DELETED_KEY]) {
        throw new NotFoundError(identifier)
      }
      return entry
    })
  }

  update(collection: string, identifier: string, slice: Partial<Entry>) {
    return this.get(collection, identifier).then(() => {
      return super.update(collection, identifier, slice)
    })
  }

  create(collection: string, document: Entry) {
    return super.create(collection, { ...document, [DELETED_KEY]: false })
  }

  remove(collection: string, identifier: string) {
    super.update(collection, identifier, { [DELETED_KEY]: true })
    return new Box()
  }

  protected getLokiCollection(collection: string) {
    const config = this.options.collections[collection]
    const name = getLokiCollectionName(collection, config)
    return this.loki.getCollection(name)
  }

  static create(
    options: DatabaseOptions,
    storeOptions: RxDBLokiJSStoreOptions
  ) {
    storeOptions.loki.throttledSaves = true
    return super.create(options, storeOptions) as Promise<RxDBLokiJSStore>
  }
}
