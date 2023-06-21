import * as Automerge from '@automerge/automerge'
import { SyncMessage } from '@automerge/automerge'

import { formatBytes } from './utils'

export class Logger {
  constructor(private name: string) {}

  logSend(syncMessage: SyncMessage) {
    this.log('send', syncMessage)
  }

  logReceive(syncMessage: SyncMessage) {
    this.log('receive', syncMessage)
  }

  private log(type: 'send' | 'receive', syncMessage: SyncMessage) {
    const time = new Date().toLocaleTimeString()
    console.log(
      `${this.name} ${type}:`,
      ...this.renderMessage(syncMessage),
      time
    )
  }

  private renderMessage(syncMessage: SyncMessage) {
    const sizeStr = `size: ${formatBytes(syncMessage.byteLength)}`
    return [sizeStr, Automerge.decodeSyncMessage(syncMessage)]
  }
}
