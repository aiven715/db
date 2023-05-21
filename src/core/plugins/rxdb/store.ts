import { NotFoundError } from '~/core/errors'

import { LokiJSStore } from '../../stores/lokijs'
import { DatabaseOptions, Entry, Query } from '../../types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export class RxDBLokiJSStore extends LokiJSStore {
  list(collection: string, query?: Query) {
    return super.list(collection, {
      ...query,
      filter: {
        ...query?.filter,
        [DELETED_KEY]: false,
      },
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

  set(collection: string, identifier: string, slice: Partial<Entry>) {
    return this.get(collection, identifier).then(() => {
      return super.set(collection, identifier, slice)
    })
  }

  create(collection: string, document: Entry) {
    return super.create(collection, { ...document, [DELETED_KEY]: false })
  }

  remove(collection: string, identifier: string) {
    return super.set(collection, identifier, { [DELETED_KEY]: true })
  }

  static create(options: DatabaseOptions) {
    const adapter = new LokiIncrementalIndexedDBAdapter()
    return super.create(options, adapter)
  }
}

const DELETED_KEY = '_deleted'
