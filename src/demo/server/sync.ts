import * as Automerge from '@automerge/automerge'
import { SyncState } from '@automerge/automerge'
import { Client as ClientSocket, Server as ServerSocket } from 'mock-socket'

import { CLIENT_ID_PARAM_KEY, SERVER_URL } from '~/demo/constants'

import { Store } from '../store'
import { Socket, Sync } from '../sync'

export type ServerSyncOptions = {
  onClientsChange?: (clients: ClientSocket[]) => void
  onStart?: VoidFunction
  onStop?: VoidFunction
}

// TODO: should use extended version of a store to set "updatedAt" flag on save
export class ServerSync extends Sync {
  private server?: ServerSocket
  private syncStates = new Map<string, Map<string, SyncState>>()

  protected get peers() {
    return this.server!.clients()
  }

  constructor(store: Store, private options: ServerSyncOptions) {
    super('SERVER', store)
  }

  start() {
    this.stop()
    this.server = new ServerSocket(SERVER_URL)
    this.server.on('connection', (socket) => {
      this.options.onClientsChange?.(this.server!.clients())
      socket.on('message', (message) =>
        this.receiveMessage(message as ArrayBuffer, socket)
      )
    })
    this.server.on('close', () =>
      this.options.onClientsChange?.(this.server!.clients())
    )
    this.options.onStart?.()
  }

  stop() {
    this.server?.close()
    delete this.server
    this.options.onStop?.()
  }

  protected setSyncState(id: string, syncState: SyncState, socket: Socket) {
    const clientId = this.getClientId(socket)
    const clientStates = this.getOrCreateClientStates(clientId)
    clientStates.set(id, syncState)
  }

  protected getOrCreateSyncState(id: string, socket: Socket) {
    const clientId = this.getClientId(socket)
    const clientStates = this.getOrCreateClientStates(clientId)
    let syncState = clientStates.get(id)
    if (!syncState) {
      syncState = Automerge.initSyncState()
      clientStates.set(id, syncState)
    }
    return syncState
  }

  private getOrCreateClientStates(clientId: string) {
    let clientStates = this.syncStates.get(clientId)
    if (!clientStates) {
      clientStates = new Map()
      this.syncStates.set(clientId, clientStates)
    }
    return clientStates
  }

  private getClientId(socket: Socket) {
    const url = new URL(socket.url)
    const clientId = url.searchParams.get(CLIENT_ID_PARAM_KEY)
    if (!clientId) {
      throw new Error('Client id is not specified')
    }
    return clientId
  }
}
