import { ChangeEvent, ChangeStream } from '../change-stream'
import { Store } from '../types'

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
  // It should be dedicated for now (to keep interface simple and flexible), but in future
  // it should be possible to use any Store with any Sync (once we'll have own sync protocol)

  // Consider having ability to use abstract Store together with abstract Sync (ex. AutomergeStore with RxDBSync)
  // How to transfer information about offline changes between abstract Store and Sync?
  //
  // We will store information about what fields were updated, what was created or deleted separately.
  // After subscribing on a change stream, we'll capture all changes, broadcast them as ChangeEvent[] and then
  // delete them from the store. Additionally, we'll set a flag to not capture them until we unsubscribe from the change stream.
  //
  // TODO: how it will work with Automerge? Does automerge interested in ChangeEvent?
  // Most likely, it's not needed in RxDB or Automerge integration
  //
  // How to make that flow optional without changing public interface?
  //
  // interface Store {
  //   ...
  //   getChanges(): Box<ChangeEvent[]>
  // }

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
