import { RxAttachment, RxDocumentMeta } from 'rxdb/dist/types/types'

import {
  ATTACHMENTS_KEY,
  DELETED_KEY,
  META_KEY,
  REVISION_KEY,
} from './constants'

export type RxDBEntry = {
  id: string
  updatedAt: number | null
  [DELETED_KEY]: boolean
  [REVISION_KEY]: string
  [ATTACHMENTS_KEY]: Record<string, RxAttachment<RxDBEntry>>
  [META_KEY]: RxDocumentMeta
}
