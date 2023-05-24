import { RxDatabase } from 'rxdb'
import { replicateRxCollection } from 'rxdb/plugins/replication'
import { Subscription } from 'rxjs'

import { Sync } from '~/core/types'

import { ChangeStream } from '../../change-stream'

import { RxDBEntry } from './types'
import { createChangeEvent } from './utils'

export type RxDBHttpSyncOptions = {
  collectionName: string
  rxdb: RxDatabase
  changeStream: ChangeStream
}

export class RxDBHttpSync<T extends RxDBEntry> implements Sync {
  constructor(private options: RxDBHttpSyncOptions) {}

  private replicationState?: ReturnType<typeof replicateRxCollection<T>>
  private changeSubscription?: Subscription

  private get collection() {
    return this.options.rxdb.collections[this.options.collectionName]
  }

  start() {
    this.changeSubscription = this.collection.$.subscribe((change) => {
      this.options.changeStream.change(
        this.options.collectionName,
        createChangeEvent(change)
      )
    })
    this.replicationState = replicateRxCollection<T>({
      collection: this.collection,
      replicationIdentifier: `${this.options.collectionName}_replication`,
    })
  }

  async stop() {
    await this.replicationState?.cancel()
    this.changeSubscription?.unsubscribe()
  }
}
