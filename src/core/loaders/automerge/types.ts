import { Entry } from '../../types'

import { BINARY_DIFF_SYMBOL, BINARY_DOCUMENT_SYMBOL } from './constants'

export type ForkEntry = Entry & {
  [BINARY_DIFF_SYMBOL]?: Promise<Uint8Array[]>
  [BINARY_DOCUMENT_SYMBOL]?: Promise<Uint8Array>
}
