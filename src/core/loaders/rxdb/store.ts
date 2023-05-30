import Loki from 'lokijs'
import { RxDatabase } from 'rxdb'

import { Box } from '~/core/box'
import { NotFoundError } from '~/core/errors'
import { LokiJSStore } from '~/core/stores/lokijs'
import { createLokiInstance } from '~/core/stores/lokijs/utils'
import {
  CollectionConfig,
  DatabaseOptions,
  Entry,
  Query,
  Store,
} from '~/core/types'

import { DELETED_KEY } from '../rxdb/constants'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export class RxDBLokiJSStore implements Store {
  private constructor(private store: LokiJSStore) {}

  list(collection: string, query?: Query) {
    return this.store.list(collection, {
      ...query,
      filter: { ...query?.filter, [DELETED_KEY]: false },
    })
  }

  get(collection: string, identifier: string) {
    return this.store.get(collection, identifier).then((entry) => {
      if (entry[DELETED_KEY]) {
        throw new NotFoundError(identifier)
      }
      return entry
    })
  }

  update(collection: string, identifier: string, slice: Partial<Entry>) {
    return this.get(collection, identifier).then(() => {
      return this.store.update(collection, identifier, slice)
    })
  }

  create(collection: string, document: Entry) {
    return this.store.create(collection, { ...document, [DELETED_KEY]: false })
  }

  remove(collection: string, identifier: string) {
    this.store.update(collection, identifier, { [DELETED_KEY]: true })
    return new Box()
  }

  static async create(options: DatabaseOptions, rxdb: RxDatabase) {
    const loki = await getLokiInstance(rxdb, options)
    const store = await LokiJSStore.create(options, {
      loki,
      getLokiCollectionName,
    })
    return new this(store)
  }
}

const getLokiCollectionName = (
  collection: string,
  config: CollectionConfig
) => {
  const migrations = config.migrations || []
  return `${collection}-${migrations.length}`
}

const getLokiInstance = async (rxdb: RxDatabase, options: DatabaseOptions) => {
  const localState = await rxdb.internalStore.internals.localState
  const loki =
    localState?.databaseState.database ||
    (await createMemoryLokiInstance(options))
  loki.throttledSaves = true
  return loki
}

const createMemoryLokiInstance = async (options: DatabaseOptions) => {
  const databaseName = `${options.name}.db`
  let loki = await createLokiInstance(options, {
    adapter: new LokiIncrementalIndexedDBAdapter(),
  })
  const databaseDump = loki.serialize()
  loki.close()
  loki = new Loki(databaseName)
  loki.loadJSON(databaseDump)
  return loki
}
