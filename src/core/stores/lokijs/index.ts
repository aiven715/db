import Loki from 'lokijs'

import { Box } from '~/core/box'
import { NotFoundError } from '~/core/errors'
import {
  CollectionConfig,
  DatabaseOptions,
  Entry,
  Query,
  Store,
} from '~/core/types'
import { mergeObjects } from '~/library/utils'

import { createLokiInstance } from './utils'

export type LokiJSStoreOptions = {
  loki?: Loki
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
    const lokiCollection = this.getLokiCollection(collection)
    let results = lokiCollection.chain().find(query?.filter)
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
    const items = results.data()
    return new Box(items)
  }

  get(collection: string, identifier: string): Box<Entry> {
    const lokiCollection = this.getLokiCollection(collection)
    const primaryKey = this.getPrimaryKey(collection)
    const entry = lokiCollection.findOne({ [primaryKey]: identifier })
    if (!entry) {
      throw new NotFoundError(identifier)
    }
    return new Box(entry)
  }

  create(collection: string, entry: Entry): Box<Entry> {
    const lokiCollection = this.getLokiCollection(collection)
    const createdEntry = lokiCollection.insert(entry)
    this.loki.save()
    return new Box(createdEntry)
  }

  update(
    collection: string,
    identifier: string,
    slice: Partial<Entry>
  ): Box<Entry> {
    const lokiCollection = this.getLokiCollection(collection)
    const primaryKey = this.getPrimaryKey(collection)
    const entry = lokiCollection.findOne({ [primaryKey]: identifier })
    if (!entry) {
      throw new NotFoundError(identifier)
    }
    const updatedEntry = lokiCollection.update(mergeObjects(entry, slice))
    this.loki.save()
    return new Box(updatedEntry)
  }

  remove(collection: string, identifier: string): Box<void> {
    const lokiCollection = this.getLokiCollection(collection)
    const primaryKey = this.getPrimaryKey(collection)
    const entry = lokiCollection.findOne({ [primaryKey]: identifier })
    lokiCollection.remove(entry)
    this.loki.save()
    return new Box()
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

  static async create(
    databaseOptions: DatabaseOptions,
    storeOptions?: LokiJSStoreOptions
  ) {
    const loki =
      storeOptions?.loki || (await createLokiInstance(databaseOptions))
    return new this(loki, databaseOptions, storeOptions)
  }
}
