import { ServerSync, ServerSyncOptions } from '~/demo/server/sync'

import { ServerStore } from './store'

export class Server {
  private constructor(public sync: ServerSync, private store: ServerStore) {}

  list() {
    return this.store.list()
  }

  static async create(options: ServerSyncOptions) {
    const store = await ServerStore.create()
    const sync = new ServerSync(store, options)
    return new this(sync, store)
  }
}
