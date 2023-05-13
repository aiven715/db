import z from 'zod'

import { extendWithMetaCollection } from '~/core/meta'
import { migrate } from '~/core/migrations'

import { Collection } from './collection'
import { ReactiveStore } from './reactive-store'
import { DatabaseOptions, Store } from './types'

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O['collections']]: Collection<
    z.infer<O['collections'][K]['schema']>
  >
}

export class Database<O extends DatabaseOptions = DatabaseOptions> {
  private constructor(public collections: CollectionMap<O>) {}

  static async create<O extends DatabaseOptions>(
    options: O,
    createStore: (options: O) => Promise<Store>
  ) {
    const store = await createStore(extendWithMetaCollection(options))
    const reactiveStore = new ReactiveStore(store)

    const migrations = [] as Promise<void>[]
    const collections = {} as CollectionMap<O>
    for (const [name, config] of Object.entries(options.collections)) {
      migrations.push(migrate(name, config, store))
      collections[name as keyof CollectionMap<O>] = new Collection(
        name,
        config,
        reactiveStore
      )
    }
    await Promise.all(migrations)

    return new Database(collections)
  }
}
