import { EntityOptions, Entry, Query, Store } from "../types";

import { Storage } from "./storage";
import { MemoryStore } from "./memory-store";
import { Scheduler } from "./scheduler";
import { createDocumentsMap } from "~/database/store/utils";
import { serialize } from "~/database/automerge";

// 1. TODO: write indexes together with create/update/delete as a transaction so in case of failure we won't have inconsistent state
// 2. TODO: accept documents and indexes in a constructor of MemoryStore as initialState
export class SomeStore<T extends Entry> implements Store<T> {
  private memoryStore = new MemoryStore<T>(this.options);
  private schedulers = new Map<string, Scheduler<T>>();

  private constructor(
    private storage: Storage,
    private options: EntityOptions<T>
  ) {}

  list(query?: Query<T>): T[] {
    return this.memoryStore.list(query);
  }

  create(document: T): void {
    this.memoryStore.create(document);
    const identifier = document[this.options.primaryKey] as string;
    this.storage.set(identifier, serialize(document));
  }

  update(identifier: string, change: Partial<T>): void {
    const scheduler = this.acquireScheduler(identifier);
    this.memoryStore.update(identifier, change);
    // TODO: probably clone and serialize
    scheduler.add((c) => this.storage.set(identifier, c), change);
  }

  remove(identifier: string): void {
    this.schedulers.delete(identifier);
    this.memoryStore.remove(identifier);
    this.storage.remove(identifier);
  }

  private acquireScheduler(identifier: string): Scheduler<T> {
    const scheduler = this.schedulers.get(identifier);
    if (scheduler) {
      return scheduler;
    }
    const newScheduler = new Scheduler<T>();
    this.schedulers.set(identifier, newScheduler);
    return newScheduler;
  }

  static async create<T extends Entry>(
    options: EntityOptions<T>
  ): Promise<SomeStore<T>> {
    const storage = new Storage(options.name);
    const documents = await createDocumentsMap<T>(storage, options);
    // TODO: get indexes from storage
    return new this(storage, options);
  }
}
