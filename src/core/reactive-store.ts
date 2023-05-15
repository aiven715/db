import isEqual from 'lodash/isEqual'
import { ReplaySubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

import { Box } from './box'
import { Result } from './result'
import { Sync } from './syncs'
import { Entry, Query, Store } from './types'

// TODO: draw diagram for multi-instance
// ReactiveStore = Store, ChangeStream(for self and external changes)
// ChangeStream(change, subscribe(or subscribeQuery/subscribeEntry)) = self change, ExternalChange[] (sync, another instance)
export class ReactiveStore {
  private queries = new Map<string, ReplaySubject<Entry[]>>()
  private entries = new Map<string, ReplaySubject<Entry>>()

  // TODO: work with Sync here or in Collection
  constructor(private store: Store, private sync?: Sync) {}

  list(collection: string, query?: Query): Result<Entry[]> {
    const querySubject = this.getOrCreateQuerySubject(collection, query)
    this.store.list(collection, query).then((items) => querySubject.next(items))
    // FIXME: does not work properly because we mutate data
    return new Result(querySubject.pipe(distinctUntilChanged(isEqual)))
  }

  get(collection: string, id: string) {
    const entrySubject = this.getOrCreateEntrySubject(collection, id)
    this.store.get(collection, id).then((item) => entrySubject.next(item))
    return new Result(entrySubject.pipe(distinctUntilChanged(isEqual)))
  }

  create<T extends Entry>(collection: string, entry: T): Box<void> {
    return (
      this.store
        .create(collection, entry)
        // TODO: where and how to push if sync is enabled?
        // this.realtimeSync?.change() // when sync: true - commit & push otherwise - commit
        // this.externalSource?.change() // when sync: true - commit & push otherwise - commit
        .then(() => this.sync?.commit())
        .then(() => this.notifyQueries(collection))
    )
  }

  set(collection: string, id: string, slice: Partial<Entry>): Box<void> {
    return this.store
      .set(collection, id, slice)
      .then(() => this.sync?.commit())
      .then(() => {
        this.notifyQueries(collection)
        this.notifyEntry(collection, id)
      })
  }

  remove(collection: string, id: string): Box<void> {
    return this.store
      .remove(collection, id)
      .then(() => this.sync?.commit())
      .then(() => this.notifyQueries(collection))
  }

  private notifyQueries(collection: string) {
    for (const [key, subject] of this.queries) {
      const [keyCollection, queryStr] = this.splitKey(key)
      if (keyCollection === collection) {
        const query = queryStr ? JSON.parse(queryStr) : undefined
        this.store.list(collection, query).then((items) => subject.next(items))
      }
    }
  }

  private notifyEntry(collection: string, id: string) {
    for (const [key, subject] of this.entries) {
      const [keyCollection, keyId] = this.splitKey(key)
      if (keyCollection === collection && keyId === id) {
        this.store.get(collection, id).then((item) => subject.next(item))
        break
      }
    }
  }

  private getOrCreateQuerySubject(
    collection: string,
    query?: Query
  ): ReplaySubject<Entry[]> {
    const key = this.identifyQuery(collection, query)
    const subject = this.queries.get(key)
    if (subject) {
      return subject
    }
    const newSubject = new ReplaySubject<Entry[]>(1)
    this.queries.set(key, newSubject)
    return newSubject
  }

  private getOrCreateEntrySubject(
    collection: string,
    id: string
  ): ReplaySubject<Entry> {
    const key = this.identifyEntry(collection, id)
    const subject = this.entries.get(key)
    if (subject) {
      return subject
    }
    const newSubject = new ReplaySubject<Entry>(1)
    this.entries.set(key, newSubject)
    return newSubject
  }

  private identifyQuery(collection: string, query?: Query): string {
    // TODO: produce the same string regardless of the order of keys
    if (query) {
      return `${collection}:${JSON.stringify(query)}`
    }
    return collection
  }

  private identifyEntry(collection: string, id: string): string {
    return `${collection}:${id}`
  }

  private splitKey(key: string): [string, string | undefined] {
    const separatorIndex = key.indexOf(':')
    if (separatorIndex === -1) {
      return [key, undefined]
    }
    const collection = key.slice(0, separatorIndex)
    const query = key.slice(separatorIndex + 1)
    return [collection, query]
  }
}
