import merge from 'deepmerge'

import { Database } from '~/core/database'
import { Result } from '~/core/result'
import { DeepPartial } from '~/library/types'

import { Entry, Migration, Query, Schema } from '../types'

import { DatabaseNotFoundError, NotFoundError } from './errors'
import { FieldsResolver } from './fields'
import { Include, Relation, getRelations } from './relations'

export class Model<T extends Entry> {
  static readonly collectionName: string
  static readonly primaryKey = 'id'
  static readonly schema: Schema
  static readonly defaults: DeepPartial<Entry> = {}
  static readonly migrations: Migration[] = []
  static readonly relations: Record<string, Relation> = {}

  static database?: Database

  readonly fields: T
  private readonly fieldsResolver: FieldsResolver<T>

  // TODO: how to make it private?
  constructor(fields: T) {
    this.fieldsResolver = new FieldsResolver(fields, this.class.schema)
    this.fields = this.fieldsResolver.effective
  }

  get id() {
    return this.fields[this.class.primaryKey] as string
  }

  save() {
    const query = { filter: { id: this.id } }
    return this.class.collection
      .update(this.fieldsResolver.patch, query)
      .then(([fields]) => {
        if (!fields) {
          const { initial, patch } = this.fieldsResolver
          // Merging initial with path since we can't use this.fields proxy
          // because it will contain "undefined" for the missing fields which
          // will override defaults.
          const fields = merge(initial, patch)
          return this.class.collection.insert(fields)
        }
        return fields
      })
      .then((fields) => this.fieldsResolver.set(fields as T))
  }

  remove(input?: string | Query) {
    return this.class.remove(input)
  }

  protected get class() {
    return this.constructor as typeof Model
  }

  protected static get collection() {
    if (!this.database) {
      throw new DatabaseNotFoundError()
    }
    return this.database.collections[this.collectionName]
  }

  static get<T extends Entry, M extends typeof Model<T>, I extends Include<M>>(
    this: M,
    input?: string | Query,
    include?: I
  ) {
    if (typeof input === 'string') {
      input = { filter: { id: input } }
    }
    input = { ...input, limit: 1 }
    return (
      this.collection
        .list(input)
        // TODO: should not emit when deleted
        .tap((items) => {
          if (items.length === 0) {
            const filter = (input as Query).filter
            throw new NotFoundError(this.collectionName, filter)
          }
        })
        .switchMap(([fields]) => this.instantiate(fields, include))
    )
  }

  static getOrCreate<
    T extends Entry,
    M extends typeof Model<T>,
    I extends Include<M>
  >(this: M, fields?: DeepPartial<T>, include?: I) {
    return this.get({ filter: fields }, include).catch((err) => {
      if (err instanceof NotFoundError) {
        return this.create(fields, include)
      }
      throw err
    })
  }

  static list<T extends Entry, M extends typeof Model<T>, I extends Include<M>>(
    this: M,
    query?: Query,
    include?: I
  ) {
    return this.collection
      .list(query)
      .switchMap((items) =>
        Result.combineLatest(
          items.map((fields) => this.instantiate(fields as T, include))
        )
      )
  }

  static create<
    T extends Entry,
    M extends typeof Model<T>,
    I extends Include<M>
  >(this: M, fields?: DeepPartial<T>, include?: I) {
    // Explicitly casting to T to pretend we have all required fields.
    // In case some fields are missing, it will be caught by the schema validation
    // during save, so we won't return invalid instance.
    const instance = new this(fields as T)
    const box = instance.save().then(() => instance)
    // TODO: when Result will be lazy, we won't make a request if no one will subscribe
    return Result.fromBox(box).switchMap((instance) =>
      this.get(instance.id, include)
    )
  }

  static remove(input?: string | Query) {
    if (typeof input === 'string') {
      input = { filter: { id: input } }
    }
    return this.collection.remove(input)
  }

  private static instantiate<
    T extends Entry,
    M extends typeof Model<T>,
    I extends Include<M>
  >(this: M, fields: T, include?: I) {
    return getRelations(this, fields as T, include).map((relations) => {
      const instance = new this(fields as T) as InstanceType<M>
      return Object.assign(instance, relations)
    })
  }
}
