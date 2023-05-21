import { LokiJSStore } from '../../stores/lokijs'
import { DatabaseOptions } from '../../types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

// TODO: perform soft deletes and query based on _deleted
export class RxDBLokiJSStore extends LokiJSStore {
  static create(options: DatabaseOptions) {
    const adapter = new LokiIncrementalIndexedDBAdapter()
    return super.create(options, adapter)
  }
}
