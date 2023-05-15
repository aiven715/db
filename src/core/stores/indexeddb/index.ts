import { deserialize, serialize, update } from '~/core/automerge'

import { DatabaseOptions, Entry, Query, Store } from '../../types'

import { Idb } from './idb'

// TODO: implement indexes support
// TODO: implement query support
export class IndexedDBStore implements Store {
  constructor(private options: DatabaseOptions, private idb: Idb) {}

  async list(collection: string, query?: Query) {
    const binaries = await this.idb.list(collection)
    return binaries.map((binary) => deserialize(binary))
  }

  async get(collection: string, identifier: string) {
    const binary = await this.idb.get(collection, identifier)
    return deserialize(binary)
  }

  async create(collection: string, document: Entry) {
    const identifier = this.identifier(document, collection)
    const binary = serialize(document)
    await this.idb.set(collection, identifier, binary)
  }

  async set(collection: string, identifier: string, document: Partial<Entry>) {
    const binary = await this.idb.get(collection, identifier)
    const updated = update(binary, document)
    await this.idb.set(collection, identifier, updated)
  }

  async remove(collection: string, identifier: string) {
    await this.idb.remove(collection, identifier)
  }

  private identifier(document: Entry, collection: string) {
    return document[this.options.collections[collection].primaryKey] as string
  }

  static async create(options: DatabaseOptions) {
    const idb = await Idb.create(options)
    return new IndexedDBStore(options, idb)
  }
}
