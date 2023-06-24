import { ClientStore } from '~/demo/client/store'

import { Todo } from '../types'

import { ClientSync, ClientSyncOptions } from './sync'

export class Client {
  private constructor(public sync: ClientSync, private store: ClientStore) {}

  list() {
    return this.store.list()
  }

  async create(entry: Todo) {
    const binary = await this.store.insert(entry)
    this.sync.sendMessage(entry.id, binary)
  }

  async update(id: string, slice: Partial<Todo>) {
    await this.store.update(id, slice, (binary) =>
      this.sync.sendMessage(id, binary)
    )
  }

  static async create(id: number, options: ClientSyncOptions) {
    const store = await ClientStore.create(`client:${id}`)
    const sync = new ClientSync(store, id, options)
    return new this(sync, store)
  }
}
