import { uuid } from '@automerge/automerge'
import { clone } from 'lodash'

import { Include, Relation, getRelations } from '~/core/model/relations'
import { DeepPartial } from '~/library/types'

import { Entry, Migration, Query, Schema } from '../types'

import { DATABASE_GLOBAL_KEY } from './bootstrap'
import { createFieldsProxy } from './fields'

export class Model<T extends Entry> {
  static readonly collectionName: string
  static readonly primaryKey = 'id'
  static readonly schema: Schema
  static readonly defaults: Partial<Entry> = {}
  static readonly migrations: Migration[] = []
  static readonly relations: Record<string, Relation> = {}

  fields: T
  // #fields: T
  #patch: DeepPartial<T> = {}

  // TODO: should be Partial<T>, since user can do the following:
  // const model = new Model({ id: '1', name: 'test' })
  // model.fields.body = { text: { value: 'test' } }
  // model.save()
  // TODO: merge with defaults (id + defaults)
  constructor(fields: T) {
    // this.#fields = clone(fields)
    this.fields = createFieldsProxy(fields, this.#patch)
  }

  get id() {
    return this.fields[this.class.primaryKey] as string
  }

  save() {
    // TODO: use upsert
    return this.class.collection
      .update(this.id, clone(this.#patch))
      .then(() => {
        // FIXME: won't work with async store
        // once we'll implement returning data in update:
        // this.#fields = clone(updated)
        for (const key in this.#patch) {
          delete this.#patch[key]
        }
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

  static get<T extends Entry, M extends typeof Model<T>, I extends Include<M>>(
    this: M,
    id: string,
    include?: I
  ) {
    return this.collection.get(id).switchMap((fields) => {
      return getRelations(this, fields as T, include).map((relations) => {
        const instance = new this(fields as T) as InstanceType<M>
        return Object.assign(instance, relations)
      })
    })
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
    // TODO: return instance and also create a new instance and .save()
    return this.collection.create(fields)
  }

  static remove(id: string) {
    return this.collection.remove(id)
  }

  private static base<T extends Entry>(props: Partial<T>) {
    return { [this.primaryKey]: uuid(), ...this.defaults, ...props }
  }
}
