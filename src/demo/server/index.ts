import { ServerSync, ServerSyncOptions } from '~/demo/server/sync'

import { Store } from '../store'

export class Server {
  private constructor(public sync: ServerSync, private store: Store) {}

  list() {
    return this.store.list()
  }

  static async create(options: ServerSyncOptions) {
    const store = await Store.create('server')
    const sync = new ServerSync(store, options)
    return new this(sync, store)
  }
}
