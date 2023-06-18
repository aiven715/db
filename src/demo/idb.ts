import * as idb from 'idb'

const STORE_KEY = 'documents'

export class Idb {
  private constructor(private db: idb.IDBPDatabase) {}

  async list() {
    return this.db.getAll(STORE_KEY) as Promise<Uint8Array[]>
  }

  async set(id: string, binary: Uint8Array) {
    await this.db.put(STORE_KEY, binary, id)
  }

  async get(id: string) {
    return this.db.get(STORE_KEY, id) as Promise<Uint8Array>
  }

  static async create(name: string) {
    const db = await idb.openDB(`storage:${name}`, 1, {
      upgrade: (db) => {
        db.createObjectStore(STORE_KEY)
      },
    })
    return new this(db)
  }
}
