import { ChangeEvent, ChangeEventType } from '~/core/change-stream'

import { BINARY_DIFF_SYMBOL, BINARY_DOCUMENT_SYMBOL } from '../constants'
import { ForkEntry } from '../types'

export enum PushType {
  Insert = 'insert',
  Update = 'update',
}

type PushInsertEvent = {
  type: PushType.Insert
  id: string
  document: Uint8Array
}

type PushUpdateEvent = {
  type: PushType.Update
  id: string
  diff: Uint8Array[]
}

export type PushEvent = PushInsertEvent | PushUpdateEvent

export const createPushEvent = async (
  changeEvent: ChangeEvent
): Promise<PushEvent> => {
  switch (changeEvent.type) {
    case ChangeEventType.Insert: {
      const promise = (changeEvent.entry as ForkEntry)[BINARY_DOCUMENT_SYMBOL]!
      return promise.then((document) => ({
        type: PushType.Insert,
        id: changeEvent.entry.id as string,
        document,
      }))
    }
    case ChangeEventType.Update: {
      const promise = (changeEvent.entry as ForkEntry)[BINARY_DIFF_SYMBOL]!
      return promise.then((diff) => ({
        type: PushType.Update,
        id: changeEvent.entry.id as string,
        diff,
      }))
    }
    default:
      throw new Error(`Unknown change event type: ${changeEvent.type}`)
  }
}
