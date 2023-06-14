import { Entry } from '../../types'

import { BINARY_DIFF_SYMBOL } from './constants'

export type ForkEntry = Entry & {
  [BINARY_DIFF_SYMBOL]?: Promise<Uint8Array[]>
}
