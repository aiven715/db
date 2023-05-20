import { Store } from '~/core/types'

import { ChangeEvent, ChangeStream } from '../change-stream'

export interface Sync {
  // TODO: can be specific to HttpSync
  // pull(): Promise<void>
  // push(): Promise<void>
  start(collection: string, store: Store, changeStream: ChangeStream): void
  stop(collection: string): void
}

export class HttpSync implements Sync {
  private interval: NodeJS.Timeout | null = null
  private httpClient: any

  // Sync implementation should always have dedicated Store implementation?

  // Consider having ability to use abstract Store together with abstract Sync (ex. AutomergeStore with RxDBSync)
  // How to transfer information about offline changes between abstract Store and Sync?

  // for rxdb integration, we'll implement Store adapter around LokiJS and Sync adapter around RxDBSync
  start(collection: string, store: Store, changeStream: ChangeStream) {
    // TODO: do pull and push on start

    // TODO: how not to miss changeEvents when offline?

    // TODO: filter changes from pull
    changeStream.observable(collection).subscribe((changeEvent) => {
      // TODO: how to handle batch events? (when going from offline to online)
      this.httpClient.post('/sync', [changeEvent.entry])
    })

    this.interval = setInterval(() => {
      this.httpClient.get('/sync').then((items: any) => {
        const events = items
        changeStream.change(collection, null! as ChangeEvent)
      })
    }, 10000)
  }

  stop(collection: string) {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }
}

// WebsocketSync, HttpSync, CrossTabLeaderSync(will take any Sync), CrossTabNonLeaderSync, HttpServerSync, WebSocketServerSync, PeerToPeerSync
