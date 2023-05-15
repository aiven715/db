import { Box } from '~/core/box'

export interface Sync {
  // might be not needed
  commit(): Box<void>
  pull(): Promise<void>
  push(): Promise<void>
}
