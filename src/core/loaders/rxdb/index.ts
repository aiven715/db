import { syncChanges } from '~/core/loaders/rxdb/changes'
import { createRxDB } from '~/core/loaders/rxdb/database'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

export class RxDBLoader implements Loader {
  private constructor(
    public store: RxDBLokiJSStore,
    public sync: RxDBHttpSync
  ) {}

  static async create(changeStream: ChangeStream, options: DatabaseOptions) {
    const rxdb = await createRxDB(options)
    const store = await RxDBLokiJSStore.create(options, rxdb)
    const sync = new RxDBHttpSync(rxdb)
    syncChanges(options, rxdb, store, changeStream)
    return new this(store, sync)
  }
}
