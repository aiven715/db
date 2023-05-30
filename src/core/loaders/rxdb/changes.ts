import { uuid } from '@automerge/automerge'
import { RxChangeEvent, RxDatabase } from 'rxdb'

import { ChangeEvent, ChangeEventType, ChangeStream } from '../../change-stream'
import { DatabaseOptions } from '../../types'

import { CHANGE_SOURCE } from './constants'
import { RxDBLokiJSStore } from './store'
import { RxDBEntry } from './types'

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
      rxdb.collections[collection].upsert({
        ...change.entry,
        __instanceId: instanceId,
      })
    })
    rxdb.collections[collection].$.subscribe((change) => {
      if (change.documentData.__instanceId === instanceId) {
        return
      }
      if (!rxdb.isLeader()) {
        store.update(collection, change.documentData.id, change.documentData)
      }
      changeStream.change(collection, createChangeEvent(change))
    })
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
