import { ChangeStream } from '../../change-stream'
import { DatabaseOptions, Loader } from '../../types'

import { AutomergeStore } from './store'
import { Branch } from './store/branch'
import { AutomergeSync } from './sync'

export class AutomergeLoader implements Loader {
  private constructor(
    public store: AutomergeStore,
    public sync: AutomergeSync
  ) {}

  static async create(changeStream: ChangeStream, options: DatabaseOptions) {
    const branch = await Branch.create(options)
    const store = await AutomergeStore.create(branch, options)
    const sync = new AutomergeSync(changeStream, branch, options)
    return new this(store, sync)
  }
}
