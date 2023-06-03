import { RxDatabase } from 'rxdb'
import { ReplicationOptions } from 'rxdb/dist/types/types'
import { replicateRxCollection } from 'rxdb/plugins/replication'

import { Sync } from '~/core/types'

import { RxDBEntry } from './types'

export type RxDBStartHttpSyncOptions = {
  collectionName: string
  replicationOptions: Omit<ReplicationOptions<RxDBEntry>, 'collection'>
}

export class RxDBHttpSync implements Sync {
  constructor(private rxdb: RxDatabase) {}

  start(options: RxDBStartHttpSyncOptions) {
    const collection = this.rxdb.collections[options.collectionName]
    const replicationState = replicateRxCollection({
      ...options.replicationOptions,
      collection: collection,
    })
    replicationState.run()
    return replicationState
  }
}
