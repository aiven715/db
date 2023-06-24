import { SyncState } from '@automerge/automerge'
import * as Automerge from '@automerge/automerge'
import { WebSocket } from 'mock-socket'

import { ClientStore } from '~/demo/client/store'
import {
  CHECKPOINT_PARAM_KEY,
  CLIENT_ID_PARAM_KEY,
  SERVER_URL,
} from '~/demo/constants'

import { Socket, Sync } from '../sync'

export type ClientSyncOptions = {
  onConnect?: VoidFunction
  onDisconnect?: VoidFunction
}

export class ClientSync extends Sync {
  private syncStates = new Map<string, SyncState>()
  private socket?: WebSocket

  protected get peers() {
    return this.socket ? [this.socket] : []
  }

  constructor(
    protected override store: ClientStore,
    private id: number,
    private options: ClientSyncOptions
  ) {
    super(`CLIENT #${id}`, store)
  }

  async start() {
    this.socket = new WebSocket(await this.url())
    this.socket.onopen = this.onConnect
    this.socket.onclose = this.onDisconnect
    this.socket.onmessage = (message) =>
      this.receiveMessage(message.data, this.socket!)
  }

  stop() {
    this.socket?.close()
  }

  override async receiveMessage(message: ArrayBuffer, peer: Socket) {
    const result = await super.receiveMessage(message, peer)
    if (result) {
      const [, nextDocument] = result
      await this.store.setCheckpoint(nextDocument.id)
      return result
    }
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

  private async url() {
    const checkpoint = await this.store.getCheckpoint()
    const url = new URL(SERVER_URL)
    url.searchParams.set(CLIENT_ID_PARAM_KEY, this.id.toString())
    if (checkpoint) {
      url.searchParams.set(CHECKPOINT_PARAM_KEY, checkpoint)
    }
    return url
  }

  private onConnect = () => {
    this.options.onConnect?.()
  }

  private onDisconnect = () => {
    this.options.onDisconnect?.()
    delete this.socket
  }
}
