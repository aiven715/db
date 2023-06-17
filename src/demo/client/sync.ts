import { SyncState } from '@automerge/automerge'
import * as Automerge from '@automerge/automerge'

import { Todo } from '~/demo/types'

import { CLIENT_ID_PARAM_KEY, SERVER_URL } from '../server/constants'
import { Store } from '../store'
import { Sync } from '../sync'

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
    this.socket!.send(newBuffer)
  }

  private onMessage = (message: ArrayBuffer) => {
    const binary = new Uint8Array(message)
    const type = binary[0]
    const payload = binary.subarray(1)
    switch (type) {
      case 0x00: {
        const document = Automerge.load(payload) as Todo
        this.store.create(document)
        return
      }
      default:
        throw new Error('Unknown first byte')
    }
  }

  private onConnect = (event: Event) => {
    this.options.onConnect?.()
  }

  private onDisconnect = (event: Event) => {
    this.options.onDisconnect?.()
  }
}
