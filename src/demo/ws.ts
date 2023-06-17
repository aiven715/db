import * as mockSocket from 'mock-socket'

import { CLIENT_ID_PARAM_KEY } from './constants'

export class WebSocket extends mockSocket.WebSocket {
  private name = `CLIENT #${this.id}`

  constructor(url: string | URL, protocols?: string | string[]) {
    super(url, protocols)
    return new Proxy(this, {
      set: (t: WebSocket, p: keyof WebSocket, v: any, r: any) => {
        if (p === 'onmessage') {
          t[p] = (message: MessageEvent<ArrayBuffer>) => {
            this.logReceive(message.data)
            return v(message)
          }
          return true
        }
        Reflect.set(t, p, v, r)
        return true
      },
    })
  }

  override send(data: ArrayBuffer) {
    this.logSend(data)
    return super.send(data)
  }

  private get id() {
    const url = new URL(this.url)
    return url.searchParams.get(CLIENT_ID_PARAM_KEY)
  }

  private logSend(data: ArrayBuffer) {
    console.log(`${this.name} send:`, data)
  }

  private logReceive(data: ArrayBuffer) {
    console.log(`${this.name} receive:`, data)
  }
}
