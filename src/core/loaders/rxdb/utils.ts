import Loki from 'lokijs'
import { RxChangeEvent } from 'rxdb'

import { createLokiInstance } from '~/core/stores/lokijs/utils'
import { CollectionConfig, DatabaseOptions } from '~/core/types'

import { ChangeEvent, ChangeEventType } from '../../change-stream'

import { CHANGE_SOURCE } from './constants'
import { RxDBEntry } from './types'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

export const createChangeEvent = <T extends RxDBEntry>(
  change: RxChangeEvent<T>
): ChangeEvent => {
  const { operation, documentData } = change
  switch (operation) {
    case 'INSERT':
      return {
        type: ChangeEventType.Create,
        entry: documentData,
        source: CHANGE_SOURCE,
      }
    case 'UPDATE':
      return {
        type: ChangeEventType.Update,
        entry: documentData,
        slice: null! as T,
        source: CHANGE_SOURCE,
      }
    case 'DELETE':
      return {
        type: ChangeEventType.Remove,
        entry: null! as T,
        source: CHANGE_SOURCE,
      }
  }
}

export const createMemoryLokiInstance = async (options: DatabaseOptions) => {
  const databaseName = `${options.name}.db`
  let loki = await createLokiInstance(options, {
    adapter: new LokiIncrementalIndexedDBAdapter(),
  })
  const databaseDump = loki.serialize()
  loki.close()
  loki = new Loki(databaseName, { throttledSaves: true })
  loki.loadJSON(databaseDump)
  return loki
}

export const getLokiCollectionName = (
  collection: string,
  config: CollectionConfig
) => {
  const migrations = config.migrations || []
  return `${collection}-${migrations.length}`
}
