import { COLLECTION_NAME } from '~/demo/constants'

import { Store } from '../store'

const CHECKPOINTS_COLLECTION_NAME = 'checkpoints'

export class ClientStore extends Store {
  async setCheckpoint(id: string) {
    await this.idb.set(CHECKPOINTS_COLLECTION_NAME, COLLECTION_NAME, id)
  }

  async getCheckpoint() {
    return this.idb.get(
      CHECKPOINTS_COLLECTION_NAME,
      COLLECTION_NAME
    ) as unknown as Promise<string | undefined>
  }

  static override async create<S extends typeof Store>(this: S, name: string) {
    return super.create(name, [
      COLLECTION_NAME,
      CHECKPOINTS_COLLECTION_NAME,
    ]) as InstanceType<S>
  }
}
