import { LokiJSStore } from '~/core/stores/lokijs'
import { DatabaseOptions, Entry, Query, Store } from '~/core/types'

import { BINARY_DIFF_SYMBOL } from '../constants'
import { ForkEntry } from '../types'

import { deserialize } from './automerge'
import { Branch } from './branch'

export class AutomergeStore implements Store {
  private constructor(
    private store: LokiJSStore,
    private branch: Branch,
    private options: DatabaseOptions
  ) {}

  list(collection: string, query?: Query) {
    return this.store.list(collection, query)
  }

  insert(collection: string, entry: Entry) {
    return this.store.insert(collection, entry).then((entry) => {
      const id = this.id(entry, collection)
      ;(entry as ForkEntry)[BINARY_DIFF_SYMBOL] = this.branch.insert(
        collection,
        id,
        entry
      )
      return entry
    })
  }

  //
  // w - w - w - w - w ------ w
  //                  \_____________.
  //
  update(collection: string, slice: Partial<Entry>, query?: Query) {
    return this.store.update(collection, slice, query).then((entries) => {
      for (const entry of entries) {
        const id = this.id(entry, collection)
        ;(entry as ForkEntry)[BINARY_DIFF_SYMBOL] = this.branch.update(
          collection,
          id,
          slice
        )
      }
      return entries
    })
  }

  remove(collection: string, query?: Query) {
    return this.store.remove(collection, query).then((entries) => {
      for (const entry of entries) {
        const id = this.id(entry, collection)
        this.branch.remove(collection, id)
      }
      return entries
    })
  }

  wipe() {
    // TODO: wipe branch as well
    return this.store.wipe()
  }

  private id(document: Entry, collection: string) {
    return document[this.options.collections[collection].primaryKey] as string
  }

  private static async populate(branch: Branch, options: DatabaseOptions) {
    const result: Record<string, Entry[]> = {}
    for (const collection in options.collections) {
      const items = await branch.listForks(collection)
      result[collection] = items.map(deserialize)
    }
    return result
  }

  static async create(branch: Branch, options: DatabaseOptions) {
    const initialData = await this.populate(branch, options)
    const store = await LokiJSStore.create(options, { initialData })
    return new this(store, branch, options)
  }
}
