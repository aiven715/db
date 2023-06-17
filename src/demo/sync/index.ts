import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'

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
  protected constructor(private store: Store) {}

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
        peer.send(message)
      }
    }
  }

  // TODO: lock document
  async receiveMessage(message: ArrayBuffer, peer: Socket) {
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
        const [nextDocument, nextSyncState] = Automerge.receiveSyncMessage(
          document,
          this.getOrCreateSyncState(id, peer),
          syncMessage
        )
        const nextBinary = Automerge.save(nextDocument)
        await this.store.set(nextBinary)
        this.setSyncState(id, nextSyncState, peer)
        this.sendUpdateMessage(id, nextBinary)
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }
}
