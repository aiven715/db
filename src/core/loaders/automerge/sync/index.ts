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

  async start() {
    for (const collection in this.options.collections) {
      // this.syncClient.pull(collection)
      // this.syncClient.push(collection)
      this.changeStream.observable(collection).subscribe(
        (changeEvents) => {}
        // this.syncClient.push(collection, changeEvent)
      )
    }
    return () => {}
  }
}
