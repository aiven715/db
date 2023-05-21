import { LokiJSStore } from '../../stores/lokijs'
import { DatabaseOptions, Entry, Query, Store } from '../../types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

// TODO: perform soft deletes and query based on _deleted
export class RxDBLokiJSStore implements Store {
  private constructor(private store: LokiJSStore) {}

  list(collection: string, query?: Query) {
    return this.store.list(collection, query)
  }

  get(collection: string, identifier: string) {
    return this.store.get(collection, identifier)
  }

  set(collection: string, identifier: string, document: Partial<Entry>) {
    return this.store.set(collection, identifier, document)
  }

  create(collection: string, document: Entry) {
    return this.store.create(collection, document)
  }

  remove(collection: string, identifier: string) {
    return this.store.remove(collection, identifier)
  }

  static async create(options: DatabaseOptions) {
    const adapter = new LokiIncrementalIndexedDBAdapter()
    const store = await LokiJSStore.create(options, adapter)
    return new this(store)
  }
}
