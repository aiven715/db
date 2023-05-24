import { RxChangeEvent } from 'rxdb'

import { ChangeEvent, ChangeEventType } from '../../change-stream'

import { CHANGE_SOURCE } from './constants'
import { RxDBEntry } from './types'

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
