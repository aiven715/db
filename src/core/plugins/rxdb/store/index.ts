import Loki from 'lokijs'

import { Box } from '~/core/box'
import { DatabaseOptions, Entry, Query, Store } from '~/core/types'

import {
  createLokiDatabase,
  createLokiQuery,
  getLokiCollectionName,
} from './utils'

export class RxDBLokiJSStore implements Store {
  private constructor(private options: DatabaseOptions, private loki: Loki) {}

  list(collection: string, query?: Query): Box<Entry[]> {
    const lokiCollection = this.getLokiCollection(collection)
    const results = lokiCollection.find(createLokiQuery(query))
    return new Box(results)
  }

  get(collection: string, identifier: string): Box<Entry> {
    throw new Error('Method not implemented.')
  }

  create(collection: string, document: Entry): Box<void> {
    throw new Error('Method not implemented.')
  }

  set(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ): Box<void> {
    throw new Error('Method not implemented.')
  }

  remove(collection: string, identifier: string): Box<void> {
    throw new Error('Method not implemented.')
  }

  private getLokiCollection(collection: string) {
    const config = this.options.collections[collection]
    const name = getLokiCollectionName(collection, config)
    return this.loki.getCollection(name)
  }

  static async create(options: DatabaseOptions) {
    const loki = await createLokiDatabase(options)
    return new this(options, loki)
  }
}
