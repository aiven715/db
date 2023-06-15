import { LiveQueries } from '~/core/live-queries'
import { DeepPartial } from '~/library/types'

import { Box } from './box'
import {
  ChangeEventAction,
  ChangeEventSource,
  ChangeStream,
} from './change-stream'
import { Result } from './result'
import { DatabaseOptions, Entry, Query, Store } from './types'

// For every observing collection, there's one subscription that listens to
// changes in the change stream and re-fetches all queries for that collection,
// emits new values to the query subjects, and makes equality check to avoid
// notifying subscribers if the data has not changed.
//
// There are 2 issues with this approach:
// 1. We re-fetch all queries for a collection even if only one query has changed.
// 2. We perform expensive equality check on every change for every query result
// even if the data has not changed.

// TODO: remove ReactiveStore and move logic into Collection
export class ReactiveStore {
  constructor(
    private store: Store,
    private liveQueries: LiveQueries,
    private changeStream: ChangeStream
  ) {}

  list(collection: string, query?: Query): Result<Entry[]> {
    return new Result(this.liveQueries.observable(collection, query))
  }

  insert<T extends Entry>(collection: string, entry: T) {
    return this.store.insert(collection, entry).then((entry) => {
      this.changeStream.change(collection, [
        {
          action: ChangeEventAction.Insert,
          entry,
          source: ChangeEventSource.Internal,
        },
      ])
      return entry as T
    })
  }

  update<T extends Entry>(
    collection: string,
    slice: DeepPartial<T>,
    query?: Query
  ) {
    return this.store.update(collection, slice, query).then((entries) => {
      this.changeStream.change(
        collection,
        entries.map((entry) => ({
          action: ChangeEventAction.Update,
          entry,
          slice,
          source: ChangeEventSource.Internal,
        }))
      )
      return entries as T[]
    })
  }

  remove(collection: string, query?: Query): Box<void> {
    return this.store.remove(collection, query).then((entries) => {
      this.changeStream.change(
        collection,
        entries.map((entry) => ({
          action: ChangeEventAction.Remove,
          entry,
          source: ChangeEventSource.Internal,
        }))
      )
    })
  }

  static create(
    options: DatabaseOptions,
    store: Store,
    changeStream: ChangeStream
  ) {
    const liveQueries = new LiveQueries(store)
    for (const collection in options.collections) {
      changeStream.observable(collection).subscribe((changeEvents) => {
        liveQueries.notify(
          collection,
          changeEvents.map((e) => e.entry)
        )
      })
    }
    return new this(store, liveQueries, changeStream)
  }
}
