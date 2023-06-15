import * as idb from 'idb'
import { IDBPDatabase } from 'idb'

import { DatabaseOptions } from '~/core/types'

import { META_COLLECTION_KEY } from './constants'

export class Idb {
  constructor(private db: IDBPDatabase) {}

  async list<T extends Uint8Array | Uint8Array[] = Uint8Array>(
    collection: string,
    db = this.db
  ): Promise<T[]> {
    return db.getAll(key(collection))
  }

  async keys(collection: string, db = this.db): Promise<IDBValidKey[]> {
    return db.getAllKeys(key(collection))
  }

  async get<T extends Uint8Array | Uint8Array[] = Uint8Array>(
    collection: string,
    id: string,
    db = this.db
  ): Promise<T | undefined> {
    return db.get(key(collection), id)
  }

  async set<T extends Uint8Array | Uint8Array[] = Uint8Array>(
    collection: string,
    id: string,
    binary: T,
    db = this.db
  ) {
    await db.put(key(collection), binary, id)
  }

  async remove(collection: string, id: string, db = this.db) {
    await db.delete(key(collection), id)
  }

  static async create(options: DatabaseOptions) {
    const db = await idb.openDB(options.name, 1, {
      upgrade: (db) => {
        for (const collectionName in options.collections) {
          // const collection = options.collections[collectionName]
          // const version = collection.migrations?.length || 0
          db.createObjectStore(key(collectionName))
        }
        db.createObjectStore(META_COLLECTION_KEY)
      },
    })
    return new Idb(db)
  }
}

const key = (collection: string) => `collection:${collection}`
