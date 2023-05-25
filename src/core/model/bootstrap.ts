import { ChangeStream } from '~/core/change-stream'

import { Database } from '../database'
import { DatabaseOptions, Loader } from '../types'

import { registry } from './registry'

declare global {
  interface Window {
    [DATABASE_GLOBAL_KEY]: Database | undefined
  }
}

export const DATABASE_GLOBAL_KEY = Symbol('DATABASE_GLOBAL_KEY')

export type BootstrapOptions = {
  databaseName: string
  createLoader: (
    options: DatabaseOptions,
    changeStream: ChangeStream
  ) => Promise<Loader>
}

export const bootstrap = async (options: BootstrapOptions) => {
  const collections: DatabaseOptions['collections'] = {}

  for (const Model of registry) {
    collections[Model.collectionName] = {
      schema: Model.schema,
      primaryKey: Model.primaryKey,
      migrations: Model.migrations,
    }
  }

  window[DATABASE_GLOBAL_KEY] = await Database.create(
    {
      name: options.databaseName,
      collections,
    },
    options.createLoader
  )
}
