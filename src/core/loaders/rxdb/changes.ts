import { uuid } from '@automerge/automerge'
import { RxChangeEvent, RxCollection, RxDatabase } from 'rxdb'

import { ChangeEvent, ChangeEventType, ChangeStream } from '../../change-stream'
import { DatabaseOptions } from '../../types'

import { CHANGE_SOURCE } from './constants'
import { RxDBLokiJSStore } from './store'
import { RxDBEntry } from './types'

const INSTANCE_ID_KEY = '__instanceId'

export const syncChanges = (
  options: DatabaseOptions,
  rxdb: RxDatabase,
  store: RxDBLokiJSStore,
  changeStream: ChangeStream
) => {
  const instanceId = uuid()

  for (const collection in options.collections) {
    changeStream.observable(collection).subscribe((change) => {
      if (change.source === CHANGE_SOURCE) {
        return
      }
      changeRxDB(rxdb.collections[collection], change, instanceId)
    })
    rxdb.collections[collection].$.subscribe((change) => {
      if (change.documentData[INSTANCE_ID_KEY] === instanceId) {
        return
      }
      if (!rxdb.isLeader()) {
        store.update(collection, change.documentData.id, change.documentData)
      }
      changeStream.change(collection, createChangeEvent(change))
    })
  }
}

export const changeRxDB = (
  collection: RxCollection,
  change: ChangeEvent,
  instanceId: string
) => {
  const primaryKey = collection.schema.jsonSchema.primaryKey as string
  switch (change.type) {
    case ChangeEventType.Create:
      collection.upsert({
        ...change.entry,
        [INSTANCE_ID_KEY]: instanceId,
      })
      break
    case ChangeEventType.Update:
      collection.upsert({
        ...change.entry,
        [INSTANCE_ID_KEY]: instanceId,
      })
      break
    case ChangeEventType.Remove:
      collection
        .find({ selector: { [primaryKey]: change.entry[primaryKey] } })
        .remove()
      break
  }
}

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
        // TODO: make a diff with "previousDocumentData"?
        slice: documentData,
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
