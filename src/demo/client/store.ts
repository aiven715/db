import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'
import { WebSocket } from 'mock-socket'

import { deserialize, update } from '~/core/loaders/automerge/store/automerge'

import { Storage } from '../storage'
import { Entry } from '../types'

// TODO: sync should be separate from Store, probably with Peer class
export class Store {
  private syncStates = new Map<string, SyncState>()

  private constructor(private storage: Storage, private socket: WebSocket) {}

  async create(entry: Entry) {
    const document = Automerge.from(entry)
    const binary = Automerge.save(document)
    await this.storage.set(entry.id, binary)
    const [syncState, syncMessage] = Automerge.generateSyncMessage(
      document,
      Automerge.initSyncState()
    )
    this.syncStates.set(entry.id, syncState)
    this.socket.send(syncMessage!.buffer)
  }

  async list() {
    const binaries = await this.storage.list()
    return binaries.map(deserialize) as Entry[]
  }

  async update(id: string, slice: Partial<Entry>) {
    const binary = await this.storage.get(id)
    const nextBinary = update(binary, slice)
    return this.storage.set(id, nextBinary)
  }

  static async create(id: number, socket: WebSocket) {
    const storage = await Storage.create(`client:${id}`)
    return new this(storage, socket)
  }
}
