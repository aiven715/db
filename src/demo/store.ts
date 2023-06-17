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
  public lock = new AsyncLock()

  private constructor(private loki: Loki, private idb: Idb) {}

  list() {
    if (!this.listSubject) {
      this.listSubject = new ReplaySubject<Todo[]>(1)
      this.reloadSubject()
    }
    return this.listSubject.asObservable()
  }

  async create(entry: Todo) {
    const document = Automerge.from(entry)
    const binary = Automerge.save(document)
    await this.set(binary)
    return binary
  }

  async update(id: string, slice: Partial<Todo>) {
    this.collection
      .chain()
      .find({ id })
      .update((item: Todo) => Object.assign(item, slice))
    this.loki.save()
    this.reloadSubject()

    return this.lock.acquire(id, async () => {
      const binary = await this.idb.get(id)
      const nextBinary = update(binary, slice)
      await this.idb.set(id, nextBinary)
      return nextBinary
    })
  }

  async set(binary: Uint8Array) {
    const todo = deserialize(binary) as Todo
    const existingTodo = this.collection.findOne({ id: todo.id })
    if (!existingTodo) {
      this.collection.insert({ ...todo })
    } else {
      this.collection
        .chain()
        .find({ id: todo.id })
        .update((item) => Object.assign(item, { ...todo }))
    }
    this.loki.save()
    this.reloadSubject()
    await this.idb.set(todo.id, binary)
  }

  async get(id: string) {
    return this.idb.get(id)
  }

  private get collection() {
    return this.loki.getCollection(COLLECTION_NAME)
  }

  private reloadSubject() {
    const items = this.collection.chain().data({ removeMeta: true }) as Todo[]
    this.listSubject?.next(items)
  }

  static async create(name: string) {
    const idb = await Idb.create(name)
    const items = (await idb.list()).map(deserialize) as Todo[]
    const loki = new Loki(name, {
      autoload: true,
      throttledSaves: true,
      persistenceMethod: 'memory',
    })
    const collection = loki.addCollection(COLLECTION_NAME)
    collection.insert(items)
    return new this(loki, idb)
  }
}
