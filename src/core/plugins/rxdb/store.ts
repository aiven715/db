import { Box } from '../../box'
import { LokiJSStore } from '../../stores/lokijs'
import { DatabaseOptions, Entry, Query } from '../../types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

// TODO: perform soft deletes and query based on _deleted
export class RxDBLokiJSStore extends LokiJSStore {
  list(collection: string, query?: Query): Box<Entry[]> {
    return super.list(collection, {
      ...query,
      filter: {
        ...query?.filter,
        _deleted: false,
      },
    })
  }

  static create(options: DatabaseOptions) {
    const adapter = new LokiIncrementalIndexedDBAdapter()
    return super.create(options, adapter)
  }
}
