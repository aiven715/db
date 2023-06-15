import z from 'zod'

import { ChangeStream } from '~/core/change-stream'

import { Collection } from './collection'
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

    const collections = {} as CollectionMap<O>
    for (const [name, config] of Object.entries(options.collections)) {
      collections[name as keyof CollectionMap<O>] = Collection.create(
        loader.store,
        changeStream,
        name,
        config
      )
    }

    return new Database(loader.store, loader.sync, collections)
  }
}
