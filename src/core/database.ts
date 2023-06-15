import z from 'zod'

import { ChangeStream } from '~/core/change-stream'

import { Collection } from './collection'
import { ReactiveStore } from './reactive-store'
import { DatabaseOptions, Loader, Store, Sync } from './types'

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O['collections']]: Collection<
    z.infer<O['collections'][K]['schema']>
  >
}

export class Database<O extends DatabaseOptions = DatabaseOptions> {
  private constructor(
    private store: Store,
    public sync: Sync,
    public collections: CollectionMap<O>
  ) {}

  wipe() {
    return this.store.wipe()
  }

  static async create<O extends DatabaseOptions>(
    options: O,
    createLoader: (changeStream: ChangeStream, options: O) => Promise<Loader>
  ) {
    const changeStream = new ChangeStream()
    const loader = await createLoader?.(changeStream, options)

    // Can it be a part of a public API?
    const reactiveStore = ReactiveStore.create(
      options,
      loader.store,
      changeStream
    )

    const collections = {} as CollectionMap<O>
    for (const [name, config] of Object.entries(options.collections)) {
      collections[name as keyof CollectionMap<O>] = new Collection(
        name,
        config,
        reactiveStore
      )
    }

    return new Database(loader.store, loader.sync, collections)
  }
}
