import isEqual from 'lodash/isEqual'
import { ReplaySubject, Subscription } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'

import { Box } from './box'
import { ChangeEventType, ChangeStream } from './change-stream'
import { Result } from './result'
import { Entry, Query, Store } from './types'

export class ReactiveStore {
  private queries = new Map<string, ReplaySubject<Entry[]>>()
  private entries = new Map<string, ReplaySubject<Entry>>()
  private subscriptions = new Map<string, Subscription>()

  constructor(private store: Store, private changeStream: ChangeStream) {}

  list(collection: string, query?: Query): Result<Entry[]> {
    const querySubject = this.getOrCreateQuerySubject(collection, query)
    // FIXME: does not work properly because we mutate data
    return new Result(querySubject.pipe(distinctUntilChanged(isEqual)))
  }

  get(collection: string, id: string) {
    const entrySubject = this.getOrCreateEntrySubject(collection, id)
    return new Result(entrySubject.pipe(distinctUntilChanged(isEqual)))
  }

  create<T extends Entry>(collection: string, entry: T): Box<void> {
    return this.store.create(collection, entry).then(() =>
      this.changeStream.change(collection, {
        type: ChangeEventType.Create,
        entry,
        source: REACTIVE_STORE_CHANGE_SOURCE,
      })
    )
  }

  update(collection: string, id: string, slice: Partial<Entry>): Box<void> {
    return this.store.update(collection, id, slice).then((entry) =>
      this.changeStream.change(collection, {
        type: ChangeEventType.Update,
        entry,
        slice,
        source: REACTIVE_STORE_CHANGE_SOURCE,
      })
    )
  }

  remove(collection: string, id: string): Box<void> {
    return this.store.remove(collection, id).then(() =>
      this.changeStream.change(collection, {
        type: ChangeEventType.Remove,
        // TODO: specify entry once we'll return it from remove
        entry: null! as Entry,
        source: REACTIVE_STORE_CHANGE_SOURCE,
      })
    )
  }

  private observeChanges(collection: string) {
    if (this.subscriptions.has(collection)) {
      return
    }
    const subscription = this.changeStream
      .observable(collection)
      .subscribe((changeEvent) => {
        this.notifyQueries(collection)
        if (changeEvent.type === ChangeEventType.Update) {
          this.notifyEntry(collection, changeEvent.entry.id as string)
        }
      })
    this.subscriptions.set(collection, subscription)
  }

  private getOrCreateQuerySubject(collection: string, query?: Query) {
    const key = this.identifyQuery(collection, query)
    const subject = this.queries.get(key)
    if (subject) {
      return subject
    }
    const newSubject = new ReplaySubject<Entry[]>(1)
    this.store
      .list(collection, query)
      .then((items) => newSubject.next(items))
      .then(() => this.observeChanges(collection))
    this.queries.set(key, newSubject)
    return newSubject
  }

  private getOrCreateEntrySubject(collection: string, id: string) {
    const key = this.identifyEntry(collection, id)
    const subject = this.entries.get(key)
    if (subject) {
      return subject
    }
    const newSubject = new ReplaySubject<Entry>(1)
    this.store
      .get(collection, id)
      .then((item) => newSubject.next(item))
      .then(() => this.observeChanges(collection))
    this.entries.set(key, newSubject)
    return newSubject
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

export const REACTIVE_STORE_CHANGE_SOURCE = 'LOCAL'
