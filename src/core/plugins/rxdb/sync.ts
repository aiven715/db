import { ChangeStream } from '~/core/change-stream'
import { Sync } from '~/core/syncs'
import { Store } from '~/core/types'

import { RxDBEntry } from './types'

export type RxDBHttpSyncOptions = {
  pull: (last: RxDBEntry) => Promise<{ hasMore: boolean; entries: RxDBEntry[] }>
  push: (entries: RxDBEntry[]) => Promise<void>
  pullInterval?: number
}

const DEFAULT_OPTIONS: Partial<RxDBHttpSyncOptions> = {
  pullInterval: 1000 * 60 * 5, // 5 minutes
}

export class RxDBHttpSync implements Sync {
  private options: RxDBHttpSyncOptions
  private timer?: number

  constructor(
    private collection: string,
    private store: Store,
    private changeStream: ChangeStream,
    options: RxDBHttpSyncOptions
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  start() {}

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
    }
  }

  private async pull() {
    const last = await this.lastSyncedEntry()
    const { hasMore, entries } = await this.options.pull(last)
  }

  private async push() {
    const entries = await this.notSyncedEntries()
    await this.options.push(entries)
  }

  private async lastSyncedEntry() {
    return null! as RxDBEntry
  }

  private async notSyncedEntries() {
    return [] as RxDBEntry[]
  }
}

// private async request(method: string, body?: unknown) {
//   const response = await fetch(this.options.url, {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     ...(body ? { body: JSON.stringify(body) } : {}),
//   })
//   if (!response.ok) {
//     throw new Error(`HTTP error: ${response.status}`)
//   }
//   return response.json()
// }
