import Loki from 'lokijs'
import { RxDatabase, createRevision, getDefaultRxDocumentMeta } from 'rxdb'

import { RxDBEntry } from '~/core/loaders/rxdb/types'
import { LokiJSStore } from '~/core/stores/lokijs'
import { createLokiInstance } from '~/core/stores/lokijs/utils'
import { CollectionConfig, DatabaseOptions, Query, Store } from '~/core/types'

import {
  ATTACHMENTS_KEY,
  DELETED_KEY,
  META_KEY,
  REVISION_KEY,
} from '../rxdb/constants'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export class RxDBLokiJSStore implements Store {
  private constructor(private store: LokiJSStore) {}

  list(collection: string, query?: Query) {
    return this.store.list(collection, {
      ...query,
      filter: { ...query?.filter, [DELETED_KEY]: false },
    })
  }

  update(collection: string, slice: Partial<RxDBEntry>, query?: Query) {
    return this.store.update(collection, slice, {
      ...query,
      filter: { ...query?.filter, [DELETED_KEY]: false },
    })
  }

  insert(collection: string, document: RxDBEntry) {
    document = {
      ...document,
      [DELETED_KEY]: false,
      [ATTACHMENTS_KEY]: {},
      [META_KEY]: getDefaultRxDocumentMeta(),
    }
    document[REVISION_KEY] = createRevision(document)
    return this.store.insert(collection, document)
  }

  remove(collection: string, query?: Query) {
    return this.store.update(collection, { [DELETED_KEY]: true }, query)
  }

  wipe() {
    return this.store.wipe()
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
