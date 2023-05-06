import { Database } from '../database'
import { DatabaseOptions, Store } from '../types'

import { registry } from './registry'

declare global {
  interface Window {
    [DATABASE_GLOBAL_KEY]: Database | undefined
  }
}

export const DATABASE_GLOBAL_KEY = Symbol('DATABASE_GLOBAL_KEY')

export type BootstrapOptions = {
  databaseName: string
  createStore: (options: DatabaseOptions) => Promise<Store>
}

export const bootstrap = async (options: BootstrapOptions) => {
  const collections: DatabaseOptions['collections'] = {}

  for (const Model of registry) {
    collections[Model.collectionName] = {
      schema: Model.schema,
      primaryKey: Model.primaryKey,
      version: Model.version,
    }
  }

  window[DATABASE_GLOBAL_KEY] = await Database.create(
    {
      name: options.databaseName,
      collections,
    },
    options.createStore
  )
}
