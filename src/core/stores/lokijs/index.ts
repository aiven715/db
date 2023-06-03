import { clone } from 'lodash'
import Loki from 'lokijs'

import { Box } from '~/core/box'
import {
  CollectionConfig,
  DatabaseOptions,
  Entry,
  Query,
  Store,
} from '~/core/types'

import { createLokiInstance } from './utils'

export type LokiJSStoreOptions = {
  loki?: Loki
  initialData?: Record<string, Entry[]>
  getLokiCollectionName?: (
    collection: string,
    config: CollectionConfig
  ) => string
}

export class LokiJSStore implements Store {
  private constructor(
    private loki: Loki,
    private databaseOptions: DatabaseOptions,
    private storeOptions?: LokiJSStoreOptions
  ) {}

  list(collection: string, query?: Query): Box<Entry[]> {
    return new Box(() => this.query(collection, query).data())
  }

  insert(collection: string, entry: Entry): Box<Entry> {
    entry = clone(entry)
    return new Box(() => {
      const primaryKey = this.getPrimaryKey(collection)
      const lokiCollection = this.getLokiCollection(collection)
      const createdEntry = lokiCollection.insert(entry)
      this.loki.save()
      const id = createdEntry[primaryKey]
      const [item] = this.get(collection, id).data({ removeMeta: true })
      return item
    })
  }

  update(
    collection: string,
    slice: Partial<Entry>,
    query?: Query
  ): Box<Entry[]> {
    slice = clone(slice)
    return new Box(() => {
      const itemsToUpdate = this.query(collection, query).update((entry) =>
        Object.assign(entry, slice)
      )
      this.loki.save()
      return itemsToUpdate.data({ removeMeta: true })
    })
  }

  remove(collection: string, query?: Query): Box<Entry[]> {
    return new Box(() => {
      const itemsToRemove = this.query(collection, query)
      itemsToRemove.remove()
      this.loki.save()
      return itemsToRemove.data({ removeMeta: true })
    })
  }

  wipe(): Box<void> {
    return new Promise((resolve, reject) => {
      this.loki.deleteDatabase((err) => {
        if (err) {
          reject(err)
          return
        }
        resolve()
      })
    })
  }

  private getPrimaryKey(collection: string) {
    return this.databaseOptions.collections[collection].primaryKey
  }

  private getLokiCollection(collection: string) {
    const config = this.databaseOptions.collections[collection]
    const name =
      this.storeOptions?.getLokiCollectionName?.(collection, config) ||
      collection
    return this.loki.getCollection(name)
  }

  private get(collection: string, id: string) {
    const primaryKey = this.getPrimaryKey(collection)
    return this.query(collection, {
      filter: { [primaryKey]: id },
    })
  }

  private query(collection: string, query?: Query) {
    const primaryKey = this.getPrimaryKey(collection)
    const first = !!query?.filter?.[primaryKey] || query?.limit === 1
    const lokiCollection = this.getLokiCollection(collection)
    let results = lokiCollection.chain().find(query?.filter, first)
    if (query?.limit) {
      results = results.limit(query.limit)
    }
    if (query?.offset) {
      results = results.offset(query.offset)
    }
    if (query?.sort) {
      results = results.simplesort(query.sort.key, {
        desc: query.sort.direction === 'desc',
      })
    }
    return results
  }

  static insertInitialData(
    loki: Loki,
    databaseOptions: DatabaseOptions,
    storeOptions?: LokiJSStoreOptions
  ) {
    const initialData = storeOptions!.initialData!
    for (const collection in initialData) {
      const config = databaseOptions.collections[collection]
      const name =
        storeOptions?.getLokiCollectionName?.(collection, config) || collection
      const lokiCollection = loki.getCollection(name)
      if (lokiCollection) {
        lokiCollection.insert(initialData[collection])
      }
    }
    loki.save()
  }

  static async create(
    databaseOptions: DatabaseOptions,
    storeOptions?: LokiJSStoreOptions
  ) {
    const loki =
      storeOptions?.loki || (await createLokiInstance(databaseOptions))
    if (storeOptions?.initialData) {
      this.insertInitialData(loki, databaseOptions, storeOptions)
    }
    return new this(loki, databaseOptions, storeOptions)
  }
}
