import AsyncLock from 'async-lock'

import { DatabaseOptions, Entry } from '~/core/types'

import {
  applyChanges,
  diffDiffs,
  getChanges,
  serialize,
  update,
} from './automerge'
import { Idb } from './idb'

export class Branch {
  // TODO: make the lock global across multiple windows?
  private lock = new AsyncLock()

  private constructor(private idb: Idb) {}

  async insert(collection: string, id: string, entry: Entry) {
    const binary = serialize(entry)
    return this.acquireLock(id, async () => {
      await this.idb.set(collection, id, binary)
      return binary
    })
  }

  async update(collection: string, id: string, slice: Partial<Entry>) {
    return this.acquireLock(id, async () => {
      const [master, fork] = await this.get(collection, id)
      const nextFork = update(fork, slice)
      const nextDiff = getChanges(master, nextFork)
      await this.setDiff(collection, id, nextDiff)
      return nextDiff
    })
  }

  async remove(collection: string, id: string) {
    // TODO: update instead, set deleted flag and set fields to default values
    await this.idb.remove(collection, id)
  }

  async listMasters(collection: string) {
    const items = await this.idb.list<Uint8Array | Uint8Array[]>(collection)
    const keys = await this.idb.keys(collection)
    const result: Uint8Array[] = []
    for (let i = 0; i < items.length; i++) {
      const key = keys[i]
      const [, suffix] = parseId(key as string)
      if (!suffix) {
        const master = items[i] as Uint8Array
        result.push(master)
      }
    }
    return result
  }

  async listForks(collection: string) {
    const items = await this.idb.list<Uint8Array | Uint8Array[]>(collection)
    const keys = await this.idb.keys(collection)
    const result: Uint8Array[] = []
    for (let i = 0; i < items.length; i++) {
      const key = keys[i]
      const [id, suffix] = parseId(key as string)
      if (!suffix) {
        const master = items[i] as Uint8Array
        const diffIndex = keys.indexOf(getDiffId(id))
        const diff = items[diffIndex] as Uint8Array[] | undefined
        const fork = createFork(master, diff)
        result.push(fork)
      }
    }
    return result
  }

  /**
   * Reconciliation is the process af applying a diff to a master
   * document and subtracting it from the fork diff.
   */
  async reconcile(collection: string, id: string, diff: Uint8Array[]) {
    return this.acquireLock(id, async () => {
      const [master, , forkDiff] = await this.get(collection, id)
      const nextMaster = applyChanges(master, diff)
      await this.setMaster(collection, id, nextMaster)
      if (!forkDiff) {
        return
      }
      const nextForkDiff = diffDiffs(diff, forkDiff)
      await this.setDiff(collection, id, nextForkDiff)
    })
  }

  private async setDiff(collection: string, id: string, diff: Uint8Array[]) {
    const diffId = getDiffId(id)
    if (!diff.length) {
      return await this.idb.remove(collection, diffId)
    }
    await this.idb.set(collection, diffId, diff)
  }

  private async setMaster(collection: string, id: string, master: Uint8Array) {
    await this.idb.set(collection, id, master)
  }

  private async get(collection: string, id: string) {
    const diffId = getDiffId(id)
    const master = (await this.idb.get(collection, id))!
    const diff = await this.idb.get<Uint8Array[]>(collection, diffId)
    const fork = createFork(master, diff)
    return [master, fork, diff] as const
  }

  private acquireLock<T>(id: string, fn: () => Promise<T>) {
    const diffId = getDiffId(id)
    return this.lock.acquire([id, diffId], fn)
  }

  static async create(options: DatabaseOptions) {
    const idb = await Idb.create(options)
    return new Branch(idb)
  }
}

const DIFF_ID_SUFFIX = 'diff'
const ID_SEPARATOR = '-'
const getDiffId = (id: string) => `${id}${ID_SEPARATOR}${DIFF_ID_SUFFIX}`
const parseId = (id: string) => id.split(ID_SEPARATOR)

const createFork = (master: Uint8Array, diff?: Uint8Array[]) => {
  return diff ? applyChanges(master, diff) : master
}
