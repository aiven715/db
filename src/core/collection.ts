import merge from 'deepmerge'

import { DeepPartial } from '~/library/types'

import { ReactiveStore } from './reactive-store'
import { Result } from './result'
import { CollectionConfig, Entry, Query } from './types'

export class Collection<T extends Entry = Entry> {
  constructor(
    private name: string,
    private config: CollectionConfig<T>,
    private reactiveStore: ReactiveStore
  ) {}

  list(query?: Query) {
    return this.reactiveStore.list(this.name, query) as Result<T[]>
  }

  insert(entry: DeepPartial<T> = {}) {
    const defaults = this.config.defaults || {}
    const parsed = this.config.schema.parse(merge(defaults, entry)) as T
    return this.reactiveStore.insert(this.name, parsed)
  }

  update(slice: DeepPartial<T>, query?: Query) {
    const parsed = this.config.schema
      .deepPartial()
      .parse(slice) as DeepPartial<T>
    return this.reactiveStore.update(this.name, parsed, query)
  }

  remove(query?: Query) {
    return this.reactiveStore.remove(this.name, query)
  }
}
