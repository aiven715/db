import isEqual from 'lodash/isEqual'
import { ReplaySubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import stringify from 'safe-stable-stringify'

import { Entry, Query, Store } from '~/core/types'

export class LiveQueries {
  private queries = new Map<string, ReplaySubject<Entry[]>>()

  constructor(private store: Store) {}

  public notify(collection: string, entries: Entry[]) {
    const queries = this.getAffectedQueries(collection, entries)
    for (const [query, subject] of queries) {
      this.store.list(collection, query).then((items) => subject.next(items))
    }
  }

  public observable(collection: string, query?: Query) {
    const key = this.identifyQuery(collection, query)
    let subject = this.queries.get(key)
    if (!subject) {
      subject = new ReplaySubject<Entry[]>(1)
      this.store.list(collection, query).then((items) => subject!.next(items))
      this.queries.set(key, subject)
    }
    return subject.pipe(distinctUntilChanged(isEqual))
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
