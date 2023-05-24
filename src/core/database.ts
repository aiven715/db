import z from 'zod'

import { ChangeStream } from '~/core/change-stream'

import { Collection } from './collection'
import { ReactiveStore } from './reactive-store'
import { DatabaseOptions, Loader, Sync } from './types'

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
    createLoader: (options: O) => Promise<Loader>
  ) {
    const loader = await createLoader?.(options)
    const store = await loader.createStore(options)

    // Can it be a part of a public API?
    const changeStream = new ChangeStream()
    const reactiveStore = new ReactiveStore(store, changeStream)

    const collections = {} as CollectionMap<O>
    for (const [name, config] of Object.entries(options.collections)) {
      const sync = null! as Sync
      collections[name as keyof CollectionMap<O>] = new Collection(
        name,
        config,
        reactiveStore,
        sync
      )
    }

    return new Database(collections)
  }
}
