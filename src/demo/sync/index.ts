import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'

import { Logger } from '~/demo/logger'
import { Todo } from '~/demo/types'

import { Store } from '../store'

import { createMessage, parseMessage } from './message'

export type Socket = {
  url: string
  send(buffer: ArrayBuffer): void
}

export abstract class Sync {
  protected abstract get peers(): Socket[]
  protected constructor(private name: string, protected store: Store) {}
  private logger = new Logger(this.name)
  private syncing = new Set<string>()

  abstract start(): void
  abstract stop(): void
  protected abstract getOrCreateSyncState(id: string, peer: Socket): SyncState
  protected abstract setSyncState(
    id: string,
    nextSyncState: SyncState,
    peer: Socket
  ): void

  sendMessage(id: string, binary: Uint8Array) {
    if (this.syncing.has(id)) {
      return
    }
    for (const peer of this.peers) {
      const syncState = this.getOrCreateSyncState(id, peer)
      const document = Automerge.load(binary)
      const [nextSyncState, nextSyncMessage] = Automerge.generateSyncMessage(
        document,
        syncState
      )
      this.setSyncState(id, nextSyncState, peer)
      const message = createMessage(id, nextSyncMessage)
      this.logger.logSend(nextSyncMessage)
      if (nextSyncMessage) {
        this.syncing.add(id)
      }
      peer.send(message)
    }
  }

  async receiveMessage(message: ArrayBuffer, peer: Socket) {
    const { id, syncMessage } = parseMessage(message)
    this.logger.logReceive(syncMessage)
    this.syncing.delete(id)
    if (!syncMessage) {
      return
    }
    const binary = await this.store.getBinary(id)
    const document = binary
      ? Automerge.load<Todo>(binary)
      : Automerge.init<Todo>()
    const syncState = this.getOrCreateSyncState(id, peer)
    const [nextDocument, nextSyncState] = Automerge.receiveSyncMessage<Todo>(
      document,
      syncState,
      syncMessage
    )
    let nextBinary = Automerge.save(nextDocument)
    const isEmpty =
      !binary && Automerge.getAllChanges(nextDocument).length === 0
    if (!isEmpty && binary?.length !== nextBinary.length) {
      nextBinary = await this.store.upsertBinary(nextBinary)
    }
    this.setSyncState(id, nextSyncState, peer)
    this.sendMessage(id, nextBinary)
    return [nextBinary, nextDocument] as const
  }
}
