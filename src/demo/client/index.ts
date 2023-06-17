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
    this.sync.create(binary)
  }

  async update(id: string, slice: Partial<Todo>) {
    await this.store.update(id, slice)
  }

  static async create(id: number, options: ClientSyncOptions) {
    const store = await Store.create(`client:${id}`)
    const sync = new ClientSync(id, store, options)
    return new this(sync, store)
  }
}
