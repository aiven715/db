import * as Automerge from '@automerge/automerge'

import { parseMessage } from './sync/message'
import { formatBytes } from './utils'

export class Logger {
  constructor(private name: string) {}

  logSend(message: ArrayBuffer) {
    this.log('send', message)
  }

  logReceive(message: ArrayBuffer) {
    this.log('receive', message)
  }

  private log(type: 'send' | 'receive', message: ArrayBuffer) {
    const time = new Date().toLocaleTimeString()
    console.log(`${this.name} ${type}:`, ...this.renderMessage(message), time)
  }

  private renderMessage(message: ArrayBuffer) {
    const { syncMessage } = parseMessage(message)
    const sizeStr = `size: ${formatBytes(message.byteLength)}`
    return [sizeStr, Automerge.decodeSyncMessage(syncMessage)]
  }
}
