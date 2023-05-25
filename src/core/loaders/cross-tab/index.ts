import { DatabaseOptions, Loader, Store } from '../../types'

export class CrossTabLoader implements Loader {
  private constructor(public store: Store, private baseLoader: Loader) {}

  createSync(collectionName: string) {
    return this.baseLoader.createSync(collectionName)
  }

  static async create(
    options: DatabaseOptions,
    createBaseLoader: () => Promise<Loader>
  ) {
    const baseLoader = await createBaseLoader()
    return baseLoader
  }
}
