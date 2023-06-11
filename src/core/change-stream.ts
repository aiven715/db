import { Subject } from 'rxjs'

import { Entry } from './types'

export class ChangeStream {
  private subjects = new Map<string, Subject<ChangeEvent>>()

  observable(collection: string) {
    const subject = this.getOrCreateCollectionSubject(collection)
    return subject.asObservable()
  }

  change(collection: string, event: ChangeEvent) {
    const subject = this.getOrCreateCollectionSubject(collection)
    subject.next(event)
  }

  private getOrCreateCollectionSubject(collection: string) {
    const subject = this.subjects.get(collection)
    if (subject) {
      return subject
    }
    const newSubject = new Subject<ChangeEvent>()
    this.subjects.set(collection, newSubject)
    return newSubject
  }
}

type BaseChangeEvent = {
  entry: Entry
  source: string
}

export enum ChangeEventType {
  Insert = 'insert',
  Update = 'update',
  Remove = 'remove',
}

export type InsertChangeEvent = BaseChangeEvent & {
  type: ChangeEventType.Insert
  entry: Entry
}

export type UpdateChangeEvent = BaseChangeEvent & {
  type: ChangeEventType.Update
  entry: Entry
  slice: Partial<Entry>
}

export type RemoveChangeEvent = BaseChangeEvent & {
  type: ChangeEventType.Remove
  entry: Entry
}

export type ChangeEvent =
  | InsertChangeEvent
  | UpdateChangeEvent
  | RemoveChangeEvent
