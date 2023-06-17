import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'
import { Client as ClientSocket, Server as ServerSocket } from 'mock-socket'

import { Todo } from '~/demo/types'

import { Store } from '../store'
import { Sync } from '../sync'

import { CLIENT_ID_PARAM_KEY, SERVER_URL } from './constants'

export type ServerSyncOptions = {
  onClientsChange?: (clients: ClientSocket[]) => void
  onStart?: VoidFunction
  onStop?: VoidFunction
}

export class ServerSync implements Sync {
  private socket?: ServerSocket
  private syncStates = new Map<string, Map<string, SyncState>>()

  constructor(private store: Store, private options: ServerSyncOptions) {}

  start() {
    this.stop()
    this.socket = new ServerSocket(SERVER_URL)
    this.socket.on('connection', (socket) => {
      this.options.onClientsChange?.(this.socket!.clients())
      socket.on('message', (message) =>
        this.onMessage(socket, message as ArrayBuffer)
      )
    })
    this.socket.on('close', () =>
      this.options.onClientsChange?.(this.socket!.clients())
    )
    this.options.onStart?.()
  }

  stop() {
    this.socket?.close()
    delete this.socket
    this.options.onStop?.()
  }

  // TODO: lock document
  private onMessage = async (socket: ClientSocket, message: ArrayBuffer) => {
    const binary = new Uint8Array(message)
    const type = binary[0]
    const payload = binary.subarray(1)
    switch (type) {
      case 0x00: {
        const document = Automerge.load(payload) as Todo
        await this.store.create(document)
        for (const client of this.socket!.clients()) {
          if (client === socket) {
            continue
          }
          client.send(message)
        }
        return
      }
      case 0x01: {
        const clientId = this.getClientId(socket)
        const binaryId = payload.subarray(0, 32)
        const syncMessage = payload.subarray(32)
        const id = new TextDecoder().decode(binaryId)
        const [document, syncState] = Automerge.receiveSyncMessage(
          await this.store.get(id),
          this.getOrCreateSyncState(id, clientId),
          syncMessage
        )
        // TODO: save to store, should we lock?
        this.setSyncState(id, clientId, syncState)
        for (const client of this.socket!.clients()) {
          const clientId = this.getClientId(client)
          const syncState = this.getOrCreateSyncState(id, clientId)
          const [nextSyncState, nextSyncMessage] =
            Automerge.generateSyncMessage(document, syncState)
          this.setSyncState(id, clientId, nextSyncState)

          if (nextSyncMessage) {
            const newBuffer = new ArrayBuffer(
              1 + 32 + nextSyncMessage.byteLength
            )
            const newBytes = new Uint8Array(newBuffer)
            newBytes[0] = 0x01
            newBytes.set(binaryId, 1)
            newBytes.set(nextSyncMessage, 1 + 32)
            client.send(newBytes)
          }
        }
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }

  private getClientId(socket: ClientSocket) {
    const url = new URL(socket.url)
    const clientId = url.searchParams.get(CLIENT_ID_PARAM_KEY)
    if (!clientId) {
      throw new Error('Client id is not specified')
    }
    return clientId
  }

  private setSyncState(id: string, peerId: string, syncState: SyncState) {}

  private getOrCreateSyncState(id: string, peerId: string) {
    let peer = this.syncStates.get(peerId)
    if (!peer) {
      peer = new Map()
      this.syncStates.set(peerId, peer)
    }
    let syncState = peer.get(id)
    if (!syncState) {
      syncState = Automerge.initSyncState()
      peer.set(id, syncState)
    }
    return syncState
  }
}
