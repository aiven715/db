import * as idb from 'idb'

export class Idb {
  private constructor(private db: idb.IDBPDatabase) {}

  async list(collectionName: string) {
    return this.db.getAll(collectionName) as Promise<Uint8Array[]>
  }

  async set(collectionName: string, id: string, value: unknown) {
    await this.db.put(collectionName, value, id)
  }

  async get(collectionName: string, id: string) {
    return this.db.get(collectionName, id) as Promise<Uint8Array>
  }

  static async create(name: string, collectionNames: string[]) {
    const db = await idb.openDB(`storage:${name}`, 1, {
      upgrade: (db) => {
        for (const collectionName of collectionNames) {
          db.createObjectStore(collectionName)
        }
      },
    })
    return new this(db)
  }
}
