import * as Automerge from '@automerge/automerge'

import { Todo } from '~/demo/types'

import { Store } from '../store'

export class ServerStore extends Store {
  override async set(binary: Uint8Array) {
    const document = Automerge.load<Todo>(binary)
    const nextDocument = Automerge.change<Todo>(document, (doc) => {
      doc.updatedAt = Date.now()
    })
    const nextBinary = Automerge.save(nextDocument)
    await super.set(nextBinary)
    return nextBinary
  }

  static override async create() {
    return super.create('server')
  }
}
