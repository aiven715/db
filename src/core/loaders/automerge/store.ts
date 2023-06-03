import { LokiJSStore } from '../../stores/lokijs'
import { DatabaseOptions, Entry, Query, Store } from '../../types'

import { Idb } from './idb'
import { Queue } from './queue'
import { applyChanges, deserialize, getDiff, serialize, update } from './utils'

export class AutomergeStore implements Store {
  private schedulers = new Map<string, Queue>()

  private constructor(
    private store: LokiJSStore,
    private idb: Idb,
    private options: DatabaseOptions
  ) {}

  list(collection: string, query?: Query) {
    return this.store.list(collection, query)
  }

  insert(collection: string, entry: Entry) {
    return this.store.insert(collection, entry).then((entry) => {
      const id = this.identifier(entry, collection)
      const binary = serialize(entry)
      this.idb.set(collection, id, binary)
      return entry
    })
  }

  update(collection: string, slice: Partial<Entry>, query?: Query) {
    return this.store.update(collection, slice, query).then((entries) => {
      for (const entry of entries) {
        const id = this.identifier(entry, collection)
        const diffId = getDiffId(id)
        const queue = this.getOrCreateQueue(id)
        // TODO: assign promise to entry.meta and passthrough it in reactiveStore to changeStream
        const promise = queue.add(async () => {
          const master = await this.idb.get(collection, id)
          const diff = await this.idb.get<Uint8Array[]>(collection, diffId)
          const fork = diff ? applyChanges(master, diff) : master
          const nextFork = update(fork, slice)
          const nextDiff = getDiff(master, nextFork)
          await this.idb.set<Uint8Array[]>(collection, diffId, nextDiff)
          return nextDiff
        })
      }
      return entries
    })
  }

  remove(collection: string, query?: Query) {
    return this.store.remove(collection, query).then(async (entries) => {
      for (const entry of entries) {
        const id = this.identifier(entry, collection)
        // TODO: update instead, set deleted flag and set fields to default values
        await this.idb.remove(collection, id)
      }
      return entries
    })
  }

  wipe() {
    return this.store.wipe()
  }

  private identifier(document: Entry, collection: string) {
    return document[this.options.collections[collection].primaryKey] as string
  }

  private getOrCreateQueue(identifier: string): Queue {
    const scheduler = this.schedulers.get(identifier)
    if (scheduler) {
      return scheduler
    }
    const newScheduler = new Queue()
    this.schedulers.set(identifier, newScheduler)
    return newScheduler
  }

  private static async loadInitialData(idb: Idb, options: DatabaseOptions) {
    const result: Record<string, Entry[]> = {}
    for (const collection in options.collections) {
      const items = await idb.list<Uint8Array | Uint8Array[]>(collection)
      const keys = await idb.keys(collection)
      for (let i = 0; i < items.length; i++) {
        const key = keys[i]
        const item = items[i]
        const [id, suffix] = parseId(key as string)
        if (!suffix) {
          const diffIndex = keys.indexOf(getDiffId(id))
          const diff = items[diffIndex] as Uint8Array[] | undefined
          const fork = diff ? applyChanges(item as Uint8Array, diff) : item
          const forkEntry = deserialize(fork as Uint8Array)
          result[collection] = result[collection] || []
          result[collection].push(forkEntry)
        }
      }
    }
    return result
  }

  static async create(options: DatabaseOptions) {
    const idb = await Idb.create(options)
    const initialData = await this.loadInitialData(idb, options)
    const store = await LokiJSStore.create(options, { initialData })
    return new this(store, idb, options)
  }
}

const DIFF_ID_SUFFIX = 'diff'
const ID_SEPARATOR = '-'
const getDiffId = (id: string) => `${id}${ID_SEPARATOR}${DIFF_ID_SUFFIX}`
const parseId = (id: string) => id.split(ID_SEPARATOR)
