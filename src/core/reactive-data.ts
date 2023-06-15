import isEqual from 'lodash/isEqual'
import { ReplaySubject } from 'rxjs'
import { distinctUntilChanged } from 'rxjs/operators'
import stringify from 'safe-stable-stringify'

import { Entry, Query, Store } from '~/core/types'

export class ReactiveData {
  private queries = new Map<string, ReplaySubject<Entry[]>>()

  constructor(private collection: string, private store: Store) {}

  public notify(entries: Entry[]) {
    const queries = this.getAffectedQueries(entries)
    for (const [query, subject] of queries) {
      this.store
        .list(this.collection, query)
        .then((items) => subject.next(items))
    }
  }

  public observable(query?: Query) {
    const key = this.stringifyQuery(query)
    let subject = this.queries.get(key)
    if (!subject) {
      subject = new ReplaySubject<Entry[]>(1)
      this.store
        .list(this.collection, query)
        .then((items) => subject!.next(items))
      this.queries.set(key, subject)
    }
    return subject.pipe(distinctUntilChanged(isEqual))
  }

  private getAffectedQueries(entries: Entry[]) {
    const queries = []
    for (const [queryStr, subject] of this.queries) {
      const query = this.parseQuery(queryStr)
      if (this.matchesQuery(entries, query)) {
        queries.push([query, subject] as const)
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

  private stringifyQuery(query: Query = {}): string {
    return stringify(query)
  }

  private parseQuery(queryStr: string): Query {
    return JSON.parse(queryStr) as Query
  }
}
