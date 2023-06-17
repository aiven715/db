import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'

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
  protected abstract getOrCreateSyncState(id: string, socket: Socket): SyncState
  protected abstract setSyncState(
    id: string,
    nextSyncState: SyncState,
    socket: Socket
  ): void

  sendCreateMessage(binary: Uint8Array, peers = this.peers) {
    const newBuffer = new ArrayBuffer(1 + binary.byteLength)
    const newBytes = new Uint8Array(newBuffer)
    newBytes[0] = 0x00
    newBytes.set(binary, 1)
    for (const peer of peers) {
      peer.send(newBytes.buffer)
    }
  }

  sendUpdateMessage(id: string, binary: Uint8Array) {
    for (const peer of this.peers) {
      const syncState = this.getOrCreateSyncState(id, peer)
      const [nextSyncState, nextSyncMessage] = Automerge.generateSyncMessage(
        Automerge.load(binary),
        syncState
      )
      this.setSyncState(id, nextSyncState, peer)
      if (nextSyncMessage) {
        const binaryId = new TextEncoder().encode(id)
        const newBuffer = new ArrayBuffer(1 + 32 + nextSyncMessage.byteLength)
        const newBytes = new Uint8Array(newBuffer)
        newBytes[0] = 0x01
        newBytes.set(binaryId, 1)
        newBytes.set(nextSyncMessage, 1 + 32)
        peer.send(newBytes.buffer)
      }
    }
  }

  // TODO: lock document
  async receiveMessage(message: ArrayBuffer, peer: Socket) {
    const binary = new Uint8Array(message)
    const type = binary[0]
    const payload = binary.subarray(1)
    switch (type) {
      case 0x00: {
        await this.store.set(payload)
        const peers = this.peers.filter((s) => s !== peer)
        this.sendCreateMessage(payload, peers)
        return
      }
      case 0x01: {
        const binaryId = payload.subarray(0, 32)
        const syncMessage = payload.subarray(32)
        const id = new TextDecoder().decode(binaryId)
        // TODO: what if we'll get update of a document which does not exist?
        //       can we get it?
        const [document, syncState] = Automerge.receiveSyncMessage(
          Automerge.load(await this.store.get(id)),
          this.getOrCreateSyncState(id, peer),
          syncMessage
        )
        const binary = Automerge.save(document)
        await this.store.set(binary)
        this.setSyncState(id, syncState, peer)
        this.sendUpdateMessage(id, binary)
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }
}
