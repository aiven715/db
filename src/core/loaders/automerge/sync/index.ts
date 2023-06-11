import { ChangeStream } from '~/core/change-stream'
import { DatabaseOptions, Sync } from '~/core/types'

import { Branch } from '../store/branch'

import { SyncClient } from './client'

export class AutomergeSync implements Sync {
  private syncClient = new SyncClient(this.branch, this.options)

  constructor(
    private changeStream: ChangeStream,
    private branch: Branch,
    private options: DatabaseOptions
  ) {}

  start() {
    for (const collection in this.options.collections) {
      this.changeStream
        .observable(collection)
        .subscribe((changeEvent) =>
          this.syncClient.push(changeEvent, collection)
        )
    }
    return () => {}
  }
}
