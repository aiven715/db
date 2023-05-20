import { Box } from '~/core/box'
import { Entry } from '~/core/types'

class ChangeStream {}
class ChangeBroadcast {}

class SyncState {}

export interface Sync {
  // might be not needed
  // commit(): Box<void>

  // TODO: can be specific to HttpSync
  // pull(): Promise<void>
  // push(): Promise<void>

  //
  start(): Promise<void>
  stop(): Promise<void>
  send(items: Entry[]): Promise<void>
}

interface Event {
  type: 'create' | 'update' | 'remove'
  payload: {}
}

class HttpSync implements Sync {
  interval: NodeJS.Timeout | null = null
  private httpClient: HttpClient

  start(receive: (events: Event[], getCheckpoint: () => {}) => void) {
    this.interval = setInterval(() => {
      this.httpClient.get('/sync').then((items) => {
        const events = items
        receive(events)
      })
    }, 10000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
    }
  }

  send(events: Event[]): Promise<void> {
    const items = events
    this.httpClient.post('/sync', items)
  }
}

// WebsocketSync, HttpSync, CrossTabLeaderSync(will take any Sync), CrossTabNonLeaderSync, HttpServerSync, WebSocketServerSync, PeerToPeerSync
