import { SyncMessage } from '@automerge/automerge'

export type Message = {
  documentId: string
  syncMessage: SyncMessage
}

export type Todo = {
  id: string
  title: string
  description: string
  version: number
}
