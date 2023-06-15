import isEqual from 'lodash/isEqual'
import { ReplaySubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import stringify from 'safe-stable-stringify'

import { DeepPartial } from '~/library/types'

import { Box } from './box'
import { ChangeEventAction, ChangeStream } from './change-stream'
import { Result } from './result'
import { Entry, Query, Store } from './types'

// For every observing collection, there's one subscription that listens to
// changes in the change stream and re-fetches all queries for that collection,
// emits new values to the query subjects, and makes equality check to avoid
// notifying subscribers if the data has not changed.
//
// There are 2 issues with this approach:
// 1. We re-fetch all queries for a collection even if only one query has changed.
// 2. We perform expensive equality check on every change for every query result
// even if the data has not changed.
export class ReactiveStore {
  private queries = new Map<string, ReplaySubject<Entry[]>>()

  constructor(private store: Store, private changeStream: ChangeStream) {}

  list(collection: string, query?: Query): Result<Entry[]> {
    const querySubject = this.getOrCreateQuerySubject(collection, query)
    return new Result(querySubject.pipe(distinctUntilChanged(isEqual)))
  }

  insert<T extends Entry>(collection: string, entry: T) {
    return this.store.insert(collection, entry).then((entry) => {
      this.changeStream.change(collection, {
        action: ChangeEventAction.Insert,
        entry,
        source: REACTIVE_STORE_CHANGE_SOURCE,
      })
      this.notifyAffectedQueries(collection, [entry])
      return entry as T
    })
  }

  update<T extends Entry>(
    collection: string,
    slice: DeepPartial<T>,
    query?: Query
  ) {
    return this.store.update(collection, slice, query).then((entries) => {
      for (const entry of entries) {
        this.changeStream.change(collection, {
          action: ChangeEventAction.Update,
          entry,
          slice,
          source: REACTIVE_STORE_CHANGE_SOURCE,
        })
      }
      this.notifyAffectedQueries(collection, entries)
      return entries as T[]
    })
  }

  remove(collection: string, query?: Query): Box<void> {
    return this.store.remove(collection, query).then((entries) => {
      for (const entry of entries) {
        this.changeStream.change(collection, {
          action: ChangeEventAction.Remove,
          entry,
          source: REACTIVE_STORE_CHANGE_SOURCE,
        })
      }
      this.notifyAffectedQueries(collection, entries)
    })
  }

  private notifyAffectedQueries(collection: string, entries: Entry[]) {
    const queries = this.getAffectedQueries(collection, entries)
    for (const [query, subject] of queries) {
      this.store.list(collection, query).then((items) => subject.next(items))
    }
  }

  private getAffectedQueries(collection: string, entries: Entry[]) {
    const queries = []
    for (const [key, subject] of this.queries) {
      const [keyCollection, queryStr] = this.splitKey(key)
      if (keyCollection === collection) {
        const query = queryStr ? (JSON.parse(queryStr) as Query) : undefined
        if (this.matchesQuery(entries, query)) {
          queries.push([query, subject] as const)
        }
      }
    }
    return queries
  }

  // TODO: test it
  private matchesQuery(entries: Entry[], query?: Query) {
    if (!query) {
      return true
    }
    for (const entry of entries) {
      if (this.matchesEntry(entry, query)) {
        return true
      }
    }
    return false
  }

  private matchesEntry(entry: Entry, query: Query) {
    if (!query.filter) {
      return true
    }
    for (const [key, value] of Object.entries(query.filter)) {
      if (entry[key] !== value) {
        return false
      }
    }
    return true
  }

  private getOrCreateQuerySubject(collection: string, query?: Query) {
    const key = this.identifyQuery(collection, query)
    const subject = this.queries.get(key)
    if (subject) {
      return subject
    }
    const newSubject = new ReplaySubject<Entry[]>(1)
    this.store.list(collection, query).then((items) => newSubject.next(items))
    this.queries.set(key, newSubject)
    return newSubject
  }

  private identifyQuery(collection: string, query?: Query): string {
    if (query) {
      return `${collection}:${stringify(query)}`
    }
    return collection
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
