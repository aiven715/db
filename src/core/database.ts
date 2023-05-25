import z from 'zod'

import { ChangeStream } from '~/core/change-stream'

import { Collection } from './collection'
import { ReactiveStore } from './reactive-store'
import { DatabaseOptions, Loader } from './types'

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O['collections']]: Collection<
    z.infer<O['collections'][K]['schema']>
  >
}

export class Database<O extends DatabaseOptions = DatabaseOptions> {
  private constructor(public collections: CollectionMap<O>) {}

  static async create<O extends DatabaseOptions>(
    options: O,
    createLoader: (options: O, changeStream: ChangeStream) => Promise<Loader>
  ) {
    const changeStream = new ChangeStream()
    const loader = await createLoader?.(options, changeStream)

    // Can it be a part of a public API?
    const reactiveStore = new ReactiveStore(loader.store, changeStream)

    const collections = {} as CollectionMap<O>
    for (const [name, config] of Object.entries(options.collections)) {
      const sync = loader.createSync(name)
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
