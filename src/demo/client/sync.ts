import { SyncState } from '@automerge/automerge'
import * as Automerge from '@automerge/automerge'

import { CLIENT_ID_PARAM_KEY, SERVER_URL } from '~/demo/constants'

import { Store } from '../store'
import { Sync } from '../sync'
import { WebSocket } from '../ws'

export type ClientSyncOptions = {
  onConnect?: VoidFunction
  onDisconnect?: VoidFunction
}

export class ClientSync extends Sync {
  private syncStates = new Map<string, SyncState>()
  private socket?: WebSocket

  protected get peers() {
    return [this.socket!]
  }

  constructor(
    store: Store,
    private id: number,
    private options: ClientSyncOptions
  ) {
    super(store)
  }

  start() {
    const url = `${SERVER_URL}?${CLIENT_ID_PARAM_KEY}=${this.id}`
    this.socket = new WebSocket(url)
    this.socket.onopen = this.onConnect
    this.socket.onclose = this.onDisconnect
    this.socket.onmessage = (message) =>
      this.receiveMessage(message.data, this.socket!)
  }

  stop() {
    this.socket?.close()
  }

  protected setSyncState(id: string, syncState: SyncState) {
    this.syncStates.set(id, syncState)
  }

  protected getOrCreateSyncState(id: string) {
    let syncState = this.syncStates.get(id)
    if (!syncState) {
      syncState = Automerge.initSyncState()
      this.setSyncState(id, syncState)
    }
    return syncState
  }

  private onConnect = () => {
    this.options.onConnect?.()
  }

  private onDisconnect = () => {
    this.options.onDisconnect?.()
  }
}
