import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'
import isEqual from 'lodash/isEqual'

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
  private syncing = new Set<string>()

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

  // TODO: rename into sendSyncMessage (since it's also will be used for the sync after offline)
  sendUpdateMessage(id: string, binary: Uint8Array) {
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
      if (nextSyncMessage) {
        const message = makeUpdateMessage(id, nextSyncMessage)
        this.logger.logSend(message)
        this.syncing.add(id)
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
        this.syncing.delete(id)
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

// const document = Automerge.from({ foo: 1, bar: 2 })
//
// const [syncState, syncMessage] = Automerge.generateSyncMessage(
//   document,
//   Automerge.initSyncState()
// )
//
// if (syncMessage) {
//   const [nextDocument, nextSyncState] = Automerge.receiveSyncMessage(
//     Automerge.init(),
//     Automerge.initSyncState(),
//     syncMessage
//   )
//   console.log(nextSyncState, Automerge.decodeSyncMessage(syncMessage))
// }
