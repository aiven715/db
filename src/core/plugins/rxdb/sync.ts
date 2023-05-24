import { Subscription } from 'rxjs'

import { ChangeEventType, ChangeStream } from '~/core/change-stream'
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
  private timer?: NodeJS.Timer
  private subscription?: Subscription

  constructor(
    private collection: string,
    private store: Store,
    private changeStream: ChangeStream,
    options: RxDBHttpSyncOptions
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options }
  }

  async start() {
    await this.push()
    await this.pull()
    this.subscription = this.changeStream
      .observable(this.collection)
      .subscribe(async (change) => {
        if (change.source !== CHANGE_SOURCE) {
          await this.push()
        }
      })
    this.timer = setInterval(() => this.pull(), this.options.pullInterval)
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      delete this.timer
    }
    if (this.subscription) {
      this.subscription.unsubscribe()
      delete this.subscription
    }
  }

  private async pull() {
    const last = await this.lastSyncedEntry()
    const { hasMore, entries } = await this.options.pull(last)
    for (const entry of entries) {
      try {
        // TODO: handle deletion
        await this.store.get(this.collection, entry.id)
        await this.store.update(this.collection, entry.id, entry)
        await this.changeStream.change(this.collection, {
          type: ChangeEventType.Update,
          entry,
          source: CHANGE_SOURCE,
          // TODO: do object diff
          slice: entry,
        })
      } catch {
        await this.store.create(this.collection, entry)
        await this.changeStream.change(this.collection, {
          type: ChangeEventType.Create,
          entry,
          source: CHANGE_SOURCE,
        })
      }
    }
    if (hasMore) {
      await this.pull()
    }
  }

  private async push() {
    const entries = await this.notSyncedEntries()
    await this.options.push(entries)
    await this.pull()
  }

  private async lastSyncedEntry() {
    return null! as RxDBEntry
  }

  private async notSyncedEntries() {
    return [] as RxDBEntry[]
  }
}

const CHANGE_SOURCE = 'http-sync'

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
