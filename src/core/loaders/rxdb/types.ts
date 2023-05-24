import { DELETED_KEY } from './constants'

export type RxDBEntry = {
  id: string
  updatedAt: number | null
  [DELETED_KEY]: boolean
}
