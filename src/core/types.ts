import z from 'zod'

import { Box } from './box'

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
  update(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ): Box<Entry>
  // TODO: should support an array of documents?
  // TODO: validation and "merge" set should be in Collection or ReactiveStore?
  create(collection: string, document: Entry): Box<Entry>
  remove(collection: string, identifier: string): Box<void>
}

export interface Sync {
  start(): void
  stop(): void
}

// TODO: should migration/validation also be a loader?
export interface Loader {
  store: Store
  createSync(collectionName: string): Sync
}

export type DatabaseOptions = {
  name: string
  collections: Record<string, CollectionConfig>
}

export type Migration = (entry: Entry) => Entry

export type CollectionConfig<T extends Entry = Entry> = {
  primaryKey: keyof T
  schema: Schema
  indexes?: (keyof T)[]
  // TODO: introduce "version" since schema can be changed
  // without the need of adding migrations (e.g adding an index)
  migrations?: Migration[]
}
