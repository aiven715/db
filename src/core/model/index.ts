import { DeepPartial } from '~/library/types'

import { Entry, Query, Schema } from '../types'

import { DATABASE_GLOBAL_KEY } from './bootstrap'
import { createFieldsProxy } from './fields'

export class Model<T extends Entry> {
  static collectionName: string
  static schema: Schema
  static primaryKey = 'id'
  static version = 0

  fields: T
  // #fields: T
  #patch: DeepPartial<T> = {}

  constructor(fields: T) {
    // this.#fields = clone(fields)
    this.fields = createFieldsProxy(fields, this.#patch)
  }

  get id() {
    return this.fields[this.class.primaryKey] as string
  }

  save() {
    return this.class.collection.update(this.id, this.#patch).then(() => {
      // FIXME: won't work with async store
      // once we'll implement returning data in update:
      // this.#fields = clone(updated)
      this.#patch = {}
    })
  }

  remove() {
    return this.class.collection.remove(this.id)
  }

  protected get class() {
    return this.constructor as typeof Model
  }

  protected static get collection() {
    return this.database.collections[this.collectionName]
  }

  private static get database() {
    const database = window[DATABASE_GLOBAL_KEY]
    if (!database) {
      throw new Error('Database not found')
    }
    return database
  }

  // TODO: should we notify when fields of relations change?
  static get<T extends Entry, M extends typeof Model<T>>(
    this: M,
    id: string,
    include?: any
  ) {
    return this.collection
      .get(id)
      .map((fields) => new this(fields as T) as InstanceType<M>)
  }

  static list<T extends Entry, M extends typeof Model<T>>(
    this: M,
    query?: Query,
    include?: any
  ) {
    return this.collection
      .list(query)
      .map((items) =>
        items.map((fields) => new this(fields as T) as InstanceType<M>)
      )
  }

  static create<T extends Entry, M extends typeof Model<T>>(
    this: M,
    fields: T
  ) {
    return this.collection.create(fields)
  }

  static remove(id: string) {
    return this.collection.remove(id)
  }
}
