import { Store } from '../store'
import { Todo } from '../types'

import { ClientSync, ClientSyncOptions } from './sync'

export class Client {
  private constructor(public sync: ClientSync, private store: Store) {}

  list() {
    return this.store.list()
  }

  async create(entry: Todo) {
    const binary = await this.store.create(entry)
    this.sync.sendCreateMessage(binary)
  }

  async update(id: string, slice: Partial<Todo>) {
    const binary = await this.store.update(id, slice)
    this.sync.sendUpdateMessage(id, binary)
  }

  static async create(id: number, options: ClientSyncOptions) {
    const store = await Store.create(`client:${id}`)
    const sync = new ClientSync(store, id, options)
    return new this(sync, store)
  }
}
