import { DatabaseOptions, Entry, Query, Store, Sync } from "../../types";
import { MemoryStoreCollection } from "./collection";

export class MemoryStore implements Store {
  private collections = new Map<string, MemoryStoreCollection>();

  constructor(
    private options: DatabaseOptions,
    initialData?: Record<string, Entry[]>,
    sync?: Sync
  ) {
    for (const collectionName in options.schemas) {
      const schema = options.schemas[collectionName];
      this.collections.set(
        collectionName,
        new MemoryStoreCollection(schema, initialData?.[collectionName])
      );
    }
  }

  list(collection: string, query?: Query) {
    return this.collection(collection).list(query);
  }

  get(collection: string, identifier: string) {
    return this.collection(collection).get(identifier);
  }

  create(collection: string, document: Entry) {
    return this.collection(collection).create(document);
  }

  update(collection: string, identifier: string, document: Partial<Entry>) {
    return this.collection(collection).update(identifier, document);
  }

  remove(collection: string, identifier: string) {
    return this.collection(collection).remove(identifier);
  }

  private collection(name: string) {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection ${name} does not exist.`);
    }
    return collection;
  }
}
