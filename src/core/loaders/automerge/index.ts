import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { AutomergeStore } from './store'
import { AutomergeSync } from './sync'

export class AutomergeLoader implements Loader {
  private constructor(
    public store: AutomergeStore,
    public sync: AutomergeSync
  ) {}

  static async create(changeStream: ChangeStream, options: DatabaseOptions) {
    const store = await AutomergeStore.create(options)
    const sync = new AutomergeSync()
    return new this(store, sync)
  }
}
