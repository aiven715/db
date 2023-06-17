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

export class ClientSync implements Sync {
  private syncStates = new Map<string, SyncState>()
  private socket?: WebSocket

  constructor(
    private id: number,
    private store: Store,
    private options: ClientSyncOptions
  ) {}

  private get url() {
    return `${SERVER_URL}?${CLIENT_ID_PARAM_KEY}=${this.id}`
  }

  start() {
    this.socket = new WebSocket(this.url)
    this.socket.onopen = this.onConnect
    this.socket.onclose = this.onDisconnect
    this.socket.onmessage = (message) => this.onMessage(message.data)
  }

  stop() {
    this.socket?.close()
  }

  create(binary: Uint8Array) {
    const newBuffer = new ArrayBuffer(1 + binary.byteLength)
    const newBytes = new Uint8Array(newBuffer)
    newBytes[0] = 0x00
    newBytes.set(binary, 1)
    this.socket!.send(newBytes.buffer)
  }

  update(id: string, binary: Uint8Array) {
    const [nextSyncState, nextSyncMessage] = Automerge.generateSyncMessage(
      Automerge.load(binary),
      this.getOrCreateSyncState(id)
    )
    this.setSyncState(id, nextSyncState)
    if (nextSyncMessage) {
      const binaryId = new TextEncoder().encode(id)
      const newBuffer = new ArrayBuffer(1 + 32 + nextSyncMessage.byteLength)
      const newBytes = new Uint8Array(newBuffer)
      newBytes[0] = 0x01
      newBytes.set(binaryId, 1)
      newBytes.set(nextSyncMessage, 1 + 32)
      this.socket!.send(newBytes.buffer)
    }
  }

  private onMessage = async (message: ArrayBuffer) => {
    const binary = new Uint8Array(message)
    const type = binary[0]
    const payload = binary.subarray(1)
    switch (type) {
      case 0x00: {
        await this.store.set(payload)
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
          this.getOrCreateSyncState(id),
          syncMessage
        )
        const binary = Automerge.save(document)
        await this.store.set(binary)
        this.setSyncState(id, syncState)
        this.update(id, binary)
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }

  private setSyncState(id: string, syncState: SyncState) {
    this.syncStates.set(id, syncState)
  }

  private getOrCreateSyncState(id: string) {
    let syncState = this.syncStates.get(id)
    if (!syncState) {
      syncState = Automerge.initSyncState()
      this.setSyncState(id, syncState)
    }
    return syncState
  }

  private onConnect = (event: Event) => {
    this.options.onConnect?.()
  }

  private onDisconnect = (event: Event) => {
    this.options.onDisconnect?.()
  }
}
