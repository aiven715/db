import { RxDatabase, addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { getRxStorageLoki } from 'rxdb/plugins/lokijs'
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration'

import { migrate } from '~/core/loaders/rxdb/migrations'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { createCollections } from './collections'
import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'
import { createMemoryLokiInstance } from './utils'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')
const PLUGINS = [RxDBMigrationPlugin, RxDBLeaderElectionPlugin]

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
    PLUGINS.forEach(addRxPlugin)
    const adapter = new LokiIncrementalIndexedDBAdapter()
    const rxdb = await createRxDatabase({
      name: options.name,
      storage: getRxStorageLoki({ adapter }),
    })
    await createCollections(rxdb, options)
    await migrate(rxdb)

    const localState = await rxdb.internalStore.internals.localState
    const loki =
      localState?.databaseState.database ||
      (await createMemoryLokiInstance(options))
    const store = await RxDBLokiJSStore.create(options, { loki })

    return new this(store, rxdb, changeStream)
  }
}
