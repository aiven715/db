import merge from 'deepmerge'

import {
  ChangeEventAction,
  ChangeEventSource,
  ChangeStream,
} from '~/core/change-stream'
import { LiveQueries } from '~/core/live-queries'
import { DeepPartial } from '~/library/types'

import { Result } from './result'
import { CollectionConfig, Entry, Query, Store } from './types'

export class Collection<T extends Entry = Entry> {
  constructor(
    private name: string,
    private config: CollectionConfig<T>,
    private store: Store,
    private changeStream: ChangeStream,
    private liveQueries: LiveQueries
  ) {}

  list(query?: Query) {
    return new Result(this.liveQueries.observable(query)) as Result<T[]>
  }

  insert(entry: DeepPartial<T> = {}) {
    const defaults = this.config.defaults || {}
    const parsed = this.config.schema.parse(merge(defaults, entry)) as T
    return this.store.insert(this.name, parsed).then((entry) => {
      this.changeStream.change(this.name, [
        {
          action: ChangeEventAction.Insert,
          entry,
          source: ChangeEventSource.Internal,
        },
      ])
      return entry as T
    })
  }

  update(slice: DeepPartial<T>, query?: Query) {
    const parsed = this.config.schema
      .deepPartial()
      .parse(slice) as DeepPartial<T>
    return this.store.update(this.name, parsed, query).then((entries) => {
      this.changeStream.change(
        this.name,
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

  remove(query?: Query) {
    return this.store.remove(this.name, query).then((entries) => {
      this.changeStream.change(
        this.name,
        entries.map((entry) => ({
          action: ChangeEventAction.Remove,
          entry,
          source: ChangeEventSource.Internal,
        }))
      )
    })
  }

  static create<T extends Entry = Entry>(
    store: Store,
    changeStream: ChangeStream,
    name: string,
    config: CollectionConfig<T>
  ) {
    const liveQueries = new LiveQueries(name, store)
    changeStream.observable(name).subscribe((changeEvents) => {
      liveQueries.notify(changeEvents.map((e) => e.entry))
    })
    return new this(name, config, store, changeStream, liveQueries)
  }
}
