import { SyncMessage } from '@automerge/automerge'

export type Message = {
  documentId: string
  syncMessage: SyncMessage
}

export type Todo = {
  id: string
  updatedAt: number | null
  title: string
  description: string
  __metadata?: {
    clientLastWrite: number | null
    serverLastWrite: number | null
  }
}
