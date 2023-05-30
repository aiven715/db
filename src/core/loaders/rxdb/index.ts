import { RxDatabase } from 'rxdb'

import { syncChanges } from '~/core/loaders/rxdb/changes'
import { createRxDB } from '~/core/loaders/rxdb/database'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

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
    const rxdb = await createRxDB(options)
    const store = await RxDBLokiJSStore.create(options, rxdb)
    syncChanges(options, rxdb, store, changeStream)
    return new this(store, rxdb, changeStream)
  }
}
