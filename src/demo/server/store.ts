import * as Automerge from '@automerge/automerge'

import { Todo } from '~/demo/types'

import { Store } from '../store'

export class ServerStore extends Store {
  override async save(collectionNme: string, id: string, binary: Uint8Array) {
    const document = Automerge.load<Todo>(binary)
    const nextDocument = Automerge.change<Todo>(document, (doc) => {
      doc.__metadata.serverLastWrite = Date.now()
    })
    const nextBinary = Automerge.save(nextDocument)
    return await super.save(collectionNme, id, nextBinary)
  }

  static override async create<S extends typeof Store>(this: S) {
    return super.create('server') as InstanceType<S>
  }
}
