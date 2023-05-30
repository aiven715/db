import { RxDatabase } from 'rxdb'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { ReplicationPullHandler, ReplicationPushHandler } from 'rxdb/src/types'

import { Sync } from '~/core/types'

import { ChangeStream } from '../../change-stream'

import { RxDBEntry } from './types'

export type RxDBHttpSyncOptions<T extends RxDBEntry> = {
  collectionName: string
  rxdb: RxDatabase
  changeStream: ChangeStream
  pull: (collection: string) => ReplicationPullHandler<T>
  push: (collection: string) => ReplicationPushHandler<T>
}

export class RxDBHttpSync<T extends RxDBEntry> implements Sync {
  constructor(private options: RxDBHttpSyncOptions<T>) {}

  private replicationState?: ReturnType<typeof replicateRxCollection<T>>

  private get collection() {
    return this.options.rxdb.collections[this.options.collectionName]
  }

  start() {
    const collectionName = this.options.collectionName
    this.replicationState = replicateRxCollection<T>({
      collection: this.collection,
      replicationIdentifier: `${collectionName}_replication`,
      live: true,
      pull: {
        handler: this.options.pull(collectionName),
      },
      push: {
        handler: this.options.push(collectionName),
        batchSize: 20,
      },
    })
    this.replicationState.run()
  }

  async stop() {
    await this.replicationState?.cancel()
  }
}
