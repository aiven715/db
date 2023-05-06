import * as idb from 'idb'
import { IDBPDatabase } from 'idb'

import { DatabaseOptions } from '../../types'

// Should we use FS api instead of indexedDB?
// - How to handle transactions?

// Should have one indexeddb database
// collections will have "collection:name" object store
// indexes will have "indexes" object store with keys as collection names

export class Storage {
  constructor(private db: IDBPDatabase) {}

  async list(collection: string, db = this.db): Promise<Uint8Array[]> {
    return db.getAll(key(collection))
  }

  async get(collection: string, id: string, db = this.db): Promise<Uint8Array> {
    return db.get(key(collection), id)
  }

  async set(collection: string, id: string, binary: Uint8Array, db = this.db) {
    await db.put(key(collection), binary, id)
  }

  async remove(collection: string, id: string, db = this.db) {
    await db.delete(key(collection), id)
  }

  async transaction(
    collection: string,
    callback: (db: IDBPDatabase) => Promise<void>
  ) {
    const tx = this.db.transaction(key(collection), 'readwrite')
    // TODO: test if it works
    await callback(tx.db)
    await tx.done
  }

  static async create(options: DatabaseOptions) {
    const db = await idb.openDB(options.name, 1, {
      upgrade: (db) => {
        for (const collectionName in options.collections) {
          db.createObjectStore(key(collectionName))
        }
        db.createObjectStore('indexes')
      },
    })
    return new Storage(db)
  }
}

const key = (collection: string) => `collection:${collection}`