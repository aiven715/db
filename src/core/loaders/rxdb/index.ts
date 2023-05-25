import { RxDatabase, createRxDatabase } from 'rxdb'
import { getRxStorageLoki } from 'rxdb/plugins/lokijs'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { createCollections } from './collections'
import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export class RxDBLoader implements Loader {
  private constructor(
    public store: RxDBLokiJSStore,
    private rxdb: RxDatabase,
    private changeStream: ChangeStream
  ) {}

  createSync(collectionName: string) {
    return new RxDBHttpSync({
      collectionName,
      changeStream: this.changeStream,
      rxdb: this.rxdb,
    })
  }

  static async create(options: DatabaseOptions, changeStream: ChangeStream) {
    // TODO: use adapter only in a leader tab
    const adapter = new LokiIncrementalIndexedDBAdapter()
    const rxdb = await createRxDatabase({
      name: options.name,
      storage: getRxStorageLoki({ adapter }),
    })
    await createCollections(rxdb, options)

    const localState = await rxdb.internalStore.internals.localState!
    const loki = localState.databaseState.database
    const store = await RxDBLokiJSStore.create(options, { loki })

    return new this(store, rxdb, changeStream)
  }
}
