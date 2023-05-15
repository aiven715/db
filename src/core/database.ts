import z from 'zod'

import { Collection } from './collection'
import { extendWithMetaCollection } from './meta'
import { migrate } from './migrations'
import { ReactiveStore } from './reactive-store'
import { DatabaseOptions, Store } from './types'

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O['collections']]: Collection<
    z.infer<O['collections'][K]['schema']>
  >
}

// TODO: Database should have plugins/extensions which controls how database is created
// (for cross-tab sync it can have leader election which defines what stores will be used)
export class Database<O extends DatabaseOptions = DatabaseOptions> {
  private constructor(public collections: CollectionMap<O>) {}

  static async create<O extends DatabaseOptions>(
    options: O,
    createStore: (options: O) => Promise<Store>
  ) {
    const store = await createStore(extendWithMetaCollection(options))
    // TODO: Option 1. use another store in a non-leader tab (for instance MemorySync + BroadcastChannelStore)
    // TODO: Option 2. use another reactive store (which decorates original reactive store) in a non-leader tab (with MemorySync + BroadcastChannelStore)
    // TODO: Option 3. use another store and sync in a non-leader tab
    // TODO: Option 4. use another store and real-time sync in a non-leader tab
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
