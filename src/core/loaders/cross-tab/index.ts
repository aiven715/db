import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

export class CrossTabLoader implements Loader {
  private constructor(private baseLoader: Loader) {}

  async createStore(options: DatabaseOptions) {
    return this.baseLoader.createStore(options)
  }

  createSync(collectionName: string, changeStream: ChangeStream) {
    return this.baseLoader.createSync(collectionName, changeStream)
  }

  static async create(
    options: DatabaseOptions,
    createBaseLoader: () => Promise<Loader>
  ) {
    const baseLoader = await createBaseLoader()
    return baseLoader
  }
}
