import Loki from 'lokijs'

import { Box } from '~/core/box'
import { NotFoundError } from '~/core/errors'
import { DatabaseOptions, Entry, Query, Store } from '~/core/types'
import { mergeObjects } from '~/library/utils'

import { createLokiDb, getLokiCollectionName } from './utils'

export type LokiJSStoreOptions = {
  lokiOptions?: LokiConfigOptions
  loki?: Loki
}

export class LokiJSStore implements Store {
  protected constructor(private options: DatabaseOptions, private loki: Loki) {}

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

  create(collection: string, document: Entry): Box<void> {
    const lokiCollection = this.getLokiCollection(collection)
    lokiCollection.insert(document)
    this.loki.save()
    return new Box()
  }

  update(
    collection: string,
    identifier: string,
    slice: Partial<Entry>
  ): Box<void> {
    const lokiCollection = this.getLokiCollection(collection)
    const primaryKey = this.getPrimaryKey(collection)
    const entry = lokiCollection.findOne({ [primaryKey]: identifier })
    if (!entry) {
      throw new NotFoundError(identifier)
    }
    lokiCollection.update(mergeObjects(entry, slice))
    this.loki.save()
    return new Box()
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
    return this.options.collections[collection].primaryKey
  }

  private getLokiCollection(collection: string) {
    const config = this.options.collections[collection]
    const name = getLokiCollectionName(collection, config)
    return this.loki.getCollection(name)
  }

  static async create(
    databaseOptions: DatabaseOptions,
    storeOptions?: LokiJSStoreOptions
  ) {
    const loki =
      storeOptions?.loki || (await createLokiDb(databaseOptions, storeOptions))
    return new this(databaseOptions, loki)
  }
}
