import z from 'zod'

import { Box } from './box'
import { Migration } from './migrations'

export type Identifier = string

export type Schema = z.ZodObject<z.ZodRawShape>

export type Entry = Record<string, unknown>

export type Query<T extends Entry = Entry> = {
  filter?: Partial<T>
  sort?: { key: keyof T; direction: 'asc' | 'desc' }
  limit?: number
  offset?: number
}

export interface Store {
  list(collection: string, query?: Query): Box<Entry[]>
  get(collection: string, identifier: string): Box<Entry>
  // TODO: store should return data on create and update? to avoid
  // extra get in async stores
  set(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ): Box<void>
  // TODO: have only "set"? and "set" will create if not exists (what to do with validation?)
  // TODO: rename to "insert"
  // TODO: should support an array of documents?
  create(collection: string, document: Entry): Box<void>
  remove(collection: string, identifier: string): Box<void>
}

export type DatabaseOptions = {
  name: string
  collections: Record<string, CollectionConfig>
}

export type CollectionConfig<T extends Entry = Entry> = {
  primaryKey: keyof T
  schema: Schema
  indexes?: (keyof T)[]
  migrations?: Migration[]
}
