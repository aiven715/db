import { ChangeEvent } from '~/core/change-stream'
import { DatabaseOptions } from '~/core/types'

import { Branch } from '../store/branch'

import { createPullEvent } from './pull'
import { PushType, createPushEvent } from './push'

export class SyncClient {
  constructor(private branch: Branch, private options: DatabaseOptions) {}

  // TODO: push also can happen on application start, not only in response to change event
  async push(collection: string, changeEvent?: ChangeEvent) {
    if (!changeEvent) {
      throw new Error('Pushing the whole collection is not supported yet')
    }
    const pushEvent = await createPushEvent(changeEvent)
    await this.request()
    if (pushEvent.type === PushType.Update) {
      await this.branch.reconcile(collection, pushEvent.id, pushEvent.diff)
    }
  }

  async pull(collection: string) {
    const masters = await this.branch.listMasters(collection)
    const primaryKey = this.options.collections[collection].primaryKey
    const pullEvent = createPullEvent(masters, primaryKey)
    await this.request()
    // TODO: reconcile?
  }

  private async request() {}
}
