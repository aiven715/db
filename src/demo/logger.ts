import * as Automerge from '@automerge/automerge'
import { SyncMessage } from '@automerge/automerge'

import { formatBytes } from './utils'

export class Logger {
  constructor(private name: string) {}

  logSend(syncMessage: SyncMessage | null) {
    this.log('send', syncMessage)
  }

  logReceive(syncMessage: SyncMessage | null) {
    this.log('receive', syncMessage)
  }

  private log(type: 'send' | 'receive', syncMessage: SyncMessage | null) {
    const time = new Date().toLocaleTimeString()
    console.log(
      `${this.name} ${type}:`,
      ...this.renderMessage(syncMessage),
      time
    )
  }

  private renderMessage(syncMessage: SyncMessage | null) {
    if (!syncMessage) {
      return ['END']
    }
    const sizeStr = `size: ${formatBytes(syncMessage.byteLength)}`
    return [sizeStr, Automerge.decodeSyncMessage(syncMessage)]
  }
}
