import { RxDatabase, createRxDatabase } from 'rxdb'
import { getRxStorageLoki } from 'rxdb/plugins/lokijs'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { createCollections } from './collections'
import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export class RxDBLoader implements Loader {
  private constructor(private rxdb: RxDatabase) {}

  async createStore(options: DatabaseOptions) {
    const localState = await this.rxdb.internalStore.internals.localState!
    const loki = localState.databaseState.database
    return RxDBLokiJSStore.create(options, { loki })
  }

  createSync(collectionName: string, changeStream: ChangeStream) {
    return new RxDBHttpSync({ collectionName, changeStream, rxdb: this.rxdb })
  }

  static async create(options: DatabaseOptions) {
    const adapter = new LokiIncrementalIndexedDBAdapter()
    const rxdb = await createRxDatabase({
      name: options.name,
      storage: getRxStorageLoki({ adapter }),
    })
    await createCollections(rxdb, options)
    return new this(rxdb)
  }
}

// interface Loader2 {
//   store: any
//   createSync: (collectionName: string) => void
// }
//
// class RxDBLoader2 implements Loader2 {}
