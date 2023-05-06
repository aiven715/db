import { Box } from '~/core/box'
import { CollectionConfig, Entry, Query, Store } from '~/core/types'

import { Scheduler } from './scheduler'

// 1. TODO: write indexes together with create/update/delete as a transaction so in case of failure we won't have inconsistent state
export class MemorySyncStoreCollection<T extends Entry = Entry> {
  private schedulers = new Map<string, Scheduler<T>>()

  constructor(
    private name: string,
    private config: CollectionConfig,
    private memoryStore: Store,
    private persistentStore: Store
  ) {}

  list(query?: Query) {
    return this.memoryStore.list(this.name, query)
  }

  get(identifier: string) {
    return this.memoryStore.get(this.name, identifier)
  }

  create(document: T) {
    this.memoryStore.create(this.name, document)
    this.persistentStore.create(this.name, document)
    return new Box(void 0)
  }

  update(identifier: string, change: Partial<T>) {
    const scheduler = this.acquireScheduler(identifier)
    this.memoryStore.update(this.name, identifier, change)
    // TODO: probably clone
    scheduler.add(
      (change) => this.persistentStore.update(this.name, identifier, change),
      change
    )
    return new Box(void 0)
  }

  remove(identifier: string) {
    this.schedulers.delete(identifier)
    this.memoryStore.remove(this.name, identifier)
    this.persistentStore.remove(this.name, identifier)
    return new Box(void 0)
  }

  private acquireScheduler(identifier: string): Scheduler<T> {
    const scheduler = this.schedulers.get(identifier)
    if (scheduler) {
      return scheduler
    }
    const newScheduler = new Scheduler<T>()
    this.schedulers.set(identifier, newScheduler)
    return newScheduler
  }
}
