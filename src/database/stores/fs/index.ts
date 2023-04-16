import { FsStoreBackend } from "~/database/stores/fs/backends";
import { deserialize, serialize, update } from "~/database/automerge";
import { DatabaseOptions, Entry, Query, Store, Sync } from "../../types";

// TODO: implement indexes support
export class FsStore implements Store {
  constructor(
    private options: DatabaseOptions,
    private backend: FsStoreBackend,
    private sync: Sync
  ) {}

  // TODO: implement query support
  async list(collection: string, query?: Query) {
    const fileNames = await this.backend.listDirectory(collection);
    return await Promise.all(
      fileNames.map(async (fileName) => {
        const file = await this.backend.readFile(collection, fileName);
        return deserialize(file);
      })
    );
  }

  async create(collection: string, document: Entry) {
    const identifier = this.identifier(document, collection);
    await this.backend.writeFile(collection, identifier, serialize(document));
    // TODO: report creation to sync
  }

  async update(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ) {
    const file = await this.backend.readFile(collection, identifier);
    const updated = update(file, document);
    await this.backend.writeFile(collection, identifier, updated);
    // TODO: report update to sync
  }

  async remove(collection: string, identifier: string) {
    await this.backend.removeFile(collection, identifier);
    // TODO: report deletion to sync
  }

  private identifier(document: Entry, collection: string) {
    return document[this.options.schemas[collection].primaryKey] as string;
  }

  static async init(
    options: DatabaseOptions,
    backend: FsStoreBackend,
    sync: Sync
  ) {
    for (const collectionName in options.schemas) {
      await backend.createDirectory(collectionName);
    }
    return new FsStore(options, backend, sync);
  }
}
