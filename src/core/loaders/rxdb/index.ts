import { RxDatabase } from 'rxdb'
import { ReplicationPullHandler, ReplicationPushHandler } from 'rxdb/src/types'

import { syncChanges } from '~/core/loaders/rxdb/changes'
import { createRxDB } from '~/core/loaders/rxdb/database'
import { RxDBEntry } from '~/core/loaders/rxdb/types'

import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { RxDBLokiJSStore } from './store'
import { RxDBHttpSync } from './sync'

export type RxDBLoaderOptions = {
  pull: (collection: string) => ReplicationPullHandler<RxDBEntry>
  push: (collection: string) => ReplicationPushHandler<RxDBEntry>
}

export class RxDBLoader implements Loader {
  private constructor(
    public store: RxDBLokiJSStore,
    private rxdb: RxDatabase,
    private changeStream: ChangeStream,
    private loaderOptions: RxDBLoaderOptions
  ) {}

  createSync(collectionName: string) {
    return new RxDBHttpSync({
      collectionName,
      changeStream: this.changeStream,
      rxdb: this.rxdb,
      pull: this.loaderOptions.pull,
      push: this.loaderOptions.push,
    })
  }

  static async create(
    changeStream: ChangeStream,
    options: DatabaseOptions,
    loaderOptions: RxDBLoaderOptions
  ) {
    const rxdb = await createRxDB(options)
    const store = await RxDBLokiJSStore.create(options, rxdb)
    syncChanges(options, rxdb, store, changeStream)
    return new this(store, rxdb, changeStream, loaderOptions)
  }
}
