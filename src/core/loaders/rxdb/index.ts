import { createRxDatabase } from 'rxdb'
import { getRxStorageLoki } from 'rxdb/dist/types/plugins/lokijs'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions } from '../../types'

import { createCollections } from './collections'
import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export const createLoader = async (options: DatabaseOptions) => {
  const rxdb = await createRxDatabase({
    name: options.name,
    storage: getRxStorageLoki({
      adapter: new LokiIncrementalIndexedDBAdapter(),
    }),
  })
  await createCollections(rxdb, options)

  const localState = await rxdb.internalStore.internals.localState!
  const loki = localState.databaseState.database

  return {
    createStore: () => RxDBLokiJSStore.create(options, { loki }),
    createSync: (collectionName: string, changeStream: ChangeStream) =>
      new RxDBHttpSync({ collectionName, changeStream, rxdb }),
  }
}
