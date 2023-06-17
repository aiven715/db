import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'
import { Client as ClientSocket, Server as ServerSocket } from 'mock-socket'

import { CLIENT_ID_PARAM_KEY, SERVER_URL } from '~/demo/constants'

import { Store } from '../store'
import { Sync } from '../sync'

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

  create(binary: Uint8Array, sockets: ClientSocket[] = this.socket!.clients()) {
    const newBuffer = new ArrayBuffer(1 + binary.byteLength)
    const newBytes = new Uint8Array(newBuffer)
    newBytes[0] = 0x00
    newBytes.set(binary, 1)
    for (const client of sockets) {
      client.send(newBytes.buffer)
    }
  }

  update(id: string, binary: Uint8Array) {
    for (const client of this.socket!.clients()) {
      const clientId = this.getClientId(client)
      const syncState = this.getOrCreateSyncState(id, clientId)
      const [nextSyncState, nextSyncMessage] = Automerge.generateSyncMessage(
        Automerge.load(binary),
        syncState
      )
      this.setSyncState(id, clientId, nextSyncState)
      if (nextSyncMessage) {
        const binaryId = new TextEncoder().encode(id)
        const newBuffer = new ArrayBuffer(1 + 32 + nextSyncMessage.byteLength)
        const newBytes = new Uint8Array(newBuffer)
        newBytes[0] = 0x01
        newBytes.set(binaryId, 1)
        newBytes.set(nextSyncMessage, 1 + 32)
        client.send(newBytes.buffer)
      }
    }
  }

  // TODO: lock document
  private onMessage = async (socket: ClientSocket, message: ArrayBuffer) => {
    const binary = new Uint8Array(message)
    const type = binary[0]
    const payload = binary.subarray(1)
    switch (type) {
      case 0x00: {
        await this.store.set(payload)
        const sockets = this.socket!.clients().filter((s) => s !== socket)
        this.create(payload, sockets)
        return
      }
      case 0x01: {
        const clientId = this.getClientId(socket)
        const binaryId = payload.subarray(0, 32)
        const syncMessage = payload.subarray(32)
        const id = new TextDecoder().decode(binaryId)
        const [document, syncState] = Automerge.receiveSyncMessage(
          Automerge.load(await this.store.get(id)),
          this.getOrCreateSyncState(id, clientId),
          syncMessage
        )
        const binary = Automerge.save(document)
        await this.store.set(binary)
        this.setSyncState(id, clientId, syncState)
        this.update(id, binary)
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

  private setSyncState(id: string, clientId: string, syncState: SyncState) {
    const clientStates = this.getOrCreateClientStates(clientId)
    clientStates.set(id, syncState)
  }

  private getOrCreateClientStates(clientId: string) {
    let clientStates = this.syncStates.get(clientId)
    if (!clientStates) {
      clientStates = new Map()
      this.syncStates.set(clientId, clientStates)
    }
    return clientStates
  }

  private getOrCreateSyncState(id: string, clientId: string) {
    const clientStates = this.getOrCreateClientStates(clientId)
    let syncState = clientStates.get(id)
    if (!syncState) {
      syncState = Automerge.initSyncState()
      clientStates.set(id, syncState)
    }
    return syncState
  }
}
