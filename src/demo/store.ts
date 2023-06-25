import * as Automerge from '@automerge/automerge'
import AsyncLock from 'async-lock'
import Loki from 'lokijs'
import { ReplaySubject } from 'rxjs'

import { deserialize, update } from '~/core/loaders/automerge/store/automerge'

import { COLLECTION_NAME } from './constants'
import { Idb } from './idb'
import { Todo } from './types'

export class Store {
  private listSubject?: ReplaySubject<Todo[]>
  private timeouts: Record<string, ReturnType<typeof setTimeout>> = {}
  public lock = new AsyncLock()

  constructor(private loki: Loki, protected idb: Idb) {}

  list() {
    if (!this.listSubject) {
      this.listSubject = new ReplaySubject<Todo[]>(1)
      this.reloadSubject()
    }
    return this.listSubject.asObservable()
  }

  async insert(entry: Todo) {
    const document = Automerge.from(entry)
    const binary = Automerge.save(document)
    this.insertLoki(entry)
    return await this.save(COLLECTION_NAME, entry.id, binary)
  }

  async update(
    id: string,
    slice: Partial<Todo>,
    callback: (binary: Uint8Array) => void
  ) {
    this.updateLoki(id, slice)
    clearTimeout(this.timeouts[id])
    this.timeouts[id] = setTimeout(() => {
      this.lock.acquire(id, async () => {
        const binary = await this.idb.get(COLLECTION_NAME, id)
        const nextBinary = await this.save(
          COLLECTION_NAME,
          id,
          update(binary, slice)
        )
        callback(nextBinary)
      })
    }, 50)
  }

  async upsertBinary(binary: Uint8Array) {
    const todo = Automerge.load<Todo>(binary)
    const result = await this.save(COLLECTION_NAME, todo.id, binary)
    if (!this.getLoki(todo.id)) {
      this.insertLoki(todo)
    } else {
      this.updateLoki(todo.id, todo)
    }
    return result
  }

  async getBinary(id: string) {
    return this.idb.get(COLLECTION_NAME, id)
  }

  protected async save(collectionName: string, id: string, binary: Uint8Array) {
    await this.idb.set(collectionName, id, binary)
    return binary
  }

  private getLoki(id: string) {
    return this.collection.findOne({ id })
  }

  private insertLoki(todo: Todo) {
    this.collection.insert({ ...todo })
    this.loki.save()
    this.reloadSubject()
  }

  private updateLoki(id: string, slice: Partial<Todo>) {
    this.collection
      .chain()
      .find({ id })
      .update((item) => Object.assign(item, { ...slice }))
    this.loki.save()
    this.reloadSubject()
  }

  private get collection() {
    return this.loki.getCollection(COLLECTION_NAME)
  }

  private reloadSubject() {
    const items = this.collection.chain().data({ removeMeta: true }) as Todo[]
    this.listSubject?.next(items)
  }

  static async create<S extends typeof Store>(
    this: S,
    name: string,
    collectionNames: string[] = [COLLECTION_NAME]
  ) {
    const idb = await Idb.create(name, collectionNames)
    const items = (await idb.list(COLLECTION_NAME)).map(deserialize) as Todo[]
    const loki = new Loki(name, {
      autoload: true,
      throttledSaves: true,
      persistenceMethod: 'memory',
    })
    const collection = loki.addCollection(COLLECTION_NAME)
    collection.insert(items)
    return new this(loki, idb) as unknown as InstanceType<S>
  }
}
