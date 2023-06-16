import { WebSocket } from 'mock-socket'

import { SERVER_URL } from '../server/constants'

import { Store } from './store'

export type ClientOptions = {
  onConnect?: VoidFunction
  onDisconnect?: VoidFunction
}

export class Client {
  private constructor(
    public store: Store,
    private socket: WebSocket,
    private options: ClientOptions
  ) {}

  start() {
    this.socket = new WebSocket(SERVER_URL)
    this.socket.onopen = this.onConnect
    this.socket.onclose = this.onDisconnect
  }

  stop() {
    this.socket?.close()
  }

  private onConnect = (event: Event) => {
    this.options.onConnect?.()
  }

  private onDisconnect = (event: Event) => {
    this.options.onDisconnect?.()
  }

  static async create(id: number, options: ClientOptions) {
    const socket = new WebSocket(SERVER_URL)
    const store = await Store.create(id, socket)
    return new this(store, socket, options)
  }
}
