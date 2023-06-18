import * as Automerge from '@automerge/automerge'

import { UPDATE_TYPE, parseMessage, parseUpdatePayload } from './sync/message'
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
    const { type, payload } = parseMessage(message)
    const sizeStr = `size: ${formatBytes(message.byteLength)}`
    if (type === UPDATE_TYPE) {
      const { syncMessage } = parseUpdatePayload(payload)
      return ['U', sizeStr, Automerge.decodeSyncMessage(syncMessage)]
    }
    return ['C', Automerge.load(new Uint8Array(message))]
  }
}
