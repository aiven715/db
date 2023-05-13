import { deserialize, serialize, update } from '../../automerge'
import { FsStoreBackend } from '../../stores/fs/backends'
import { DatabaseOptions, Entry, Query, Store, Sync } from '../../types'

// TODO: implement indexes support
export class FsStore implements Store {
  constructor(
    private options: DatabaseOptions,
    private backend: FsStoreBackend,
    private sync: Sync
  ) {}

  // TODO: implement query support
  async list(collection: string, query?: Query) {
    const fileNames = await this.backend.listDirectory(collection)
    return await Promise.all(
      fileNames.map(async (fileName) => this.get(collection, fileName))
    )
  }

  async get(collection: string, identifier: string) {
    const file = await this.backend.readFile(collection, identifier)
    return deserialize(file)
  }

  async create(collection: string, document: Entry) {
    const identifier = this.identifier(document, collection)
    await this.backend.writeFile(collection, identifier, serialize(document))
    // TODO: report creation to sync
  }

  async set(collection: string, identifier: string, document: Partial<Entry>) {
    const file = await this.backend.readFile(collection, identifier)
    const updated = update(file, document)
    await this.backend.writeFile(collection, identifier, updated)
    // TODO: report update to sync
  }

  async remove(collection: string, identifier: string) {
    await this.backend.removeFile(collection, identifier)
    // TODO: report deletion to sync
  }

  private identifier(document: Entry, collection: string) {
    return document[this.options.collections[collection].primaryKey] as string
  }

  static async create(
    options: DatabaseOptions,
    backend: FsStoreBackend,
    sync: Sync
  ) {
    for (const collectionName in options.collections) {
      await backend.createDirectory(collectionName)
    }
    return new FsStore(options, backend, sync)
  }
}
