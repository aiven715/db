import AsyncLock from 'async-lock'

import { DatabaseOptions, Entry } from '~/core/types'

import {
  applyChanges,
  getChanges,
  getChangesOfChanges,
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
    return this.lock.acquire(id, async () => {
      await this.idb.set(collection, id, binary)
      return binary
    })
  }

  async update(collection: string, id: string, slice: Partial<Entry>) {
    const diffId = getDiffId(id)
    return this.lock.acquire([id, diffId], async () => {
      const master = await this.idb.get(collection, id)
      const diff = await this.idb.get<Uint8Array[]>(collection, diffId)
      const fork = createFork(master, diff)
      const nextFork = update(fork, slice)
      const nextDiff = getChanges(master, nextFork)
      await this.idb.set<Uint8Array[]>(collection, diffId, nextDiff)
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
   * When diff equals the existingDiff in the database:
   * - the diff is removed.
   * - the master is updated with the diff.
   *
   * // TODO: rethink:
   * When syncedDiff is different from the diff in the database:
   * - the diff is compared the syncedDiff.
   * - the new diff is saved.
   * - the master is updated with the new diff.
   */
  // TODO: rename to applyDiff?
  /**
   * Reconciliation is the process af applying master diff to master
   * document and subtracting it from the fork diff.
   */
  async reconcile(collection: string, id: string, masterDiff: Uint8Array[]) {
    const diffId = getDiffId(id)
    return this.lock.acquire([id, diffId], async () => {
      const master = await this.idb.get(collection, id)
      const forkDiff = await this.idb.get<Uint8Array[]>(collection, diffId)
      if (!forkDiff) {
        throw new Error('Diff not found')
      }
      // TODO: strict equality?
      if (forkDiff.length === masterDiff.length) {
        await this.idb.remove(collection, diffId)
        await this.idb.set(collection, id, applyChanges(master, forkDiff))
      } else {
        // TODO: what to do when both forkDiff and diff have own changes?
        const newDiff = getChangesOfChanges(forkDiff, masterDiff)
        const newFork = createFork(master, newDiff)
        await this.idb.set(collection, diffId, newDiff)
        await this.idb.set(collection, id, newFork)
      }
    })
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

// ## Reconciliation
// - local diff does not exist
//   - diff is applied to master
// - local diff equal to applying diff
//   - diff is applied to master
//   - local diff is removed
// - applying diff has changes on top of local diff
//   - diff is applied to master
//   - local diff is removed
// - local diff has changes on top of applying diff
//   - diff is applied to master
