import { SyncMessage } from '@automerge/automerge'

export type Message = {
  documentId: string
  syncMessage: SyncMessage
}

export type Entry = {
  id: string
  title: string
  description: string
  version: number
}
