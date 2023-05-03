import { Entry, Query, Store, DatabaseOptions } from "../../types";

import { MemoryStore } from "../memory";
import { MemorySyncStoreCollection } from "./collection";
import { fetchInitialData } from "~/core/stores/memory-sync/utils";

export class MemorySyncStore implements Store {
  private constructor(
    private collections: Map<string, MemorySyncStoreCollection>
  ) {}

  list(collection: string, query?: Query) {
    return this.collection(collection).list(query);
  }

  get(collection: string, identifier: string) {
    return this.collection(collection).get(identifier);
  }

  create(collection: string, document: Entry) {
    return this.collection(collection).create(document);
  }

  update(collection: string, identifier: string, change: Partial<Entry>) {
    return this.collection(collection).update(identifier, change);
  }

  remove(collection: string, identifier: string) {
    return this.collection(collection).remove(identifier);
  }

  private collection(name: string) {
    const collection = this.collections.get(name);
    if (!collection) {
      throw new Error(`Collection ${name} not found`);
    }
    return collection;
  }

  static async init(
    options: DatabaseOptions,
    persistentStore: Store
  ): Promise<MemorySyncStore> {
    const initialData = await fetchInitialData(options, persistentStore);
    const memoryStore = new MemoryStore(options, initialData);
    const collections = new Map<string, MemorySyncStoreCollection>();

    for (const collectionName in options.schemas) {
      const schema = options.schemas[collectionName];
      const collection = new MemorySyncStoreCollection(
        collectionName,
        schema,
        memoryStore,
        persistentStore
      );
      collections.set(collectionName, collection);
    }

    return new this(collections);
  }
}
