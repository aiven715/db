import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'

import { Logger } from '~/demo/logger'
import {
  CREATE_TYPE,
  UPDATE_TYPE,
  makeCreateMessage,
  makeUpdateMessage,
  parseMessage,
  parseUpdatePayload,
} from '~/demo/sync/message'

import { Store } from '../store'

export type Socket = {
  url: string
  send(buffer: ArrayBuffer): void
}

export abstract class Sync {
  protected abstract get peers(): Socket[]
  protected constructor(private name: string, private store: Store) {}
  private logger = new Logger(this.name)

  abstract start(): void
  abstract stop(): void
  protected abstract getOrCreateSyncState(id: string, peer: Socket): SyncState
  protected abstract setSyncState(
    id: string,
    nextSyncState: SyncState,
    peer: Socket
  ): void

  sendCreateMessage(binary: Uint8Array, peers = this.peers) {
    const message = makeCreateMessage(binary)
    for (const peer of peers) {
      this.logger.logSend(message)
      peer.send(message)
    }
  }

  sendUpdateMessage(id: string, binary: Uint8Array) {
    for (const peer of this.peers) {
      const syncState = this.getOrCreateSyncState(id, peer)
      const document = Automerge.load(binary)
      const [nextSyncState, nextSyncMessage] = Automerge.generateSyncMessage(
        document,
        syncState
      )
      this.setSyncState(id, nextSyncState, peer)
      if (nextSyncMessage) {
        const message = makeUpdateMessage(id, nextSyncMessage)
        this.logger.logSend(message)
        peer.send(message)
      }
    }
  }

  async receiveMessage(message: ArrayBuffer, peer: Socket) {
    this.logger.logReceive(message)
    const { type, payload } = parseMessage(message)
    switch (type) {
      case CREATE_TYPE: {
        await this.store.set(payload)
        const peers = this.peers.filter((s) => s !== peer)
        this.sendCreateMessage(payload, peers)
        return
      }
      case UPDATE_TYPE: {
        const { id, syncMessage } = parseUpdatePayload(payload)
        // TODO: what if we'll get update of a document which does not exist?
        //       can we get it?
        const binary = await this.store.get(id)
        const document = Automerge.load(binary)
        const syncState = this.getOrCreateSyncState(id, peer)
        const [nextDocument, nextSyncState] = Automerge.receiveSyncMessage(
          document,
          syncState,
          syncMessage
        )
        const nextBinary = Automerge.save(nextDocument)
        // TODO: is it safe to rely on the length?
        if (binary.length !== nextBinary.length) {
          await this.store.set(nextBinary)
        }
        this.setSyncState(id, nextSyncState, peer)
        this.sendUpdateMessage(id, nextBinary)
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }
}
