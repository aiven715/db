import { deserialize, serialize, update } from "~/database/automerge";
import { DatabaseOptions, Entry, Query, Store, Sync } from "../../types";
import { Idb } from "./idb";

// TODO: implement indexes support
// TODO: implement query support
export class IndexedDBStore implements Store {
  constructor(
    private options: DatabaseOptions,
    private idb: Idb,
    // TODO: sync should be required
    private sync?: Sync
  ) {}

  async list(collection: string, query?: Query) {
    const binaries = await this.idb.list(collection);
    return binaries.map((binary) => deserialize(binary));
  }

  async get(collection: string, identifier: string) {
    const binary = await this.idb.get(collection, identifier);
    return deserialize(binary);
  }

  async create(collection: string, document: Entry) {
    const identifier = this.identifier(document, collection);
    const binary = serialize(document);
    await this.idb.set(collection, identifier, binary);
    // TODO: report creation to sync
  }

  async update(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ) {
    const binary = await this.idb.get(collection, identifier);
    const updated = update(binary, document);
    await this.idb.set(collection, identifier, updated);
    // TODO: report update to sync
  }

  async remove(collection: string, identifier: string) {
    await this.idb.remove(collection, identifier);
    // TODO: report deletion to sync
  }

  private identifier(document: Entry, collection: string) {
    return document[this.options.schemas[collection].primaryKey] as string;
  }

  static async init(options: DatabaseOptions, sync?: Sync) {
    const idb = await Idb.init(options);
    return new IndexedDBStore(options, idb, sync);
  }
}
