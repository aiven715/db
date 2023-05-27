import { ChangeStream } from '~/core/change-stream'

import { Database } from '../database'
import { DatabaseOptions, Loader } from '../types'

import { registry } from './registry'

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

  const database = await Database.create(
    {
      name: options.databaseName,
      collections,
    },
    options.createLoader
  )

  for (const Model of registry) {
    Model.database = database
  }
}
