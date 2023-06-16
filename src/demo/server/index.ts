import { SyncMessage, SyncState } from '@automerge/automerge'
import { Client as ClientSocket, Server as ServerSocket } from 'mock-socket'

import { Storage } from '~/demo/storage'

import { SERVER_URL } from './constants'

export type ServerOptions = {
  onClientsChange?: (clients: ClientSocket[]) => void
  onStart?: VoidFunction
  onStop?: VoidFunction
}

export class Server {
  private socket?: ServerSocket
  private syncStates = new Map<string, Map<string, SyncState>>()

  private constructor(
    private storage: Storage,
    private options: ServerOptions
  ) {}

  start() {
    this.socket = new ServerSocket(SERVER_URL)
    this.socket.on('connection', (ws) => {
      this.options.onClientsChange?.(this.socket!.clients())
      ws.on('message', (message) => this.onMessage(message as ArrayBuffer))
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

  onMessage = (message: ArrayBuffer) => {
    console.log(message)
  }

  static async create(options: ServerOptions) {
    const storage = await Storage.create('server')
    return new this(storage, options)
  }
}
