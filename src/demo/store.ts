import * as Automerge from '@automerge/automerge'
import Loki, { Collection } from 'lokijs'
import { ReplaySubject } from 'rxjs'

import { deserialize, update } from '~/core/loaders/automerge/store/automerge'

import { COLLECTION_NAME } from './constants'
import { Idb } from './idb'
import { Todo } from './types'

export class Store {
  private listSubject?: ReplaySubject<Todo[]>

  private constructor(private lokiCollection: Collection, private idb: Idb) {}

  list() {
    if (!this.listSubject) {
      this.listSubject = new ReplaySubject<Todo[]>(1)
      this.reloadSubject()
    }
    return this.listSubject.asObservable()
  }

  async create(entry: Todo) {
    this.lokiCollection.insert({ ...entry })
    this.reloadSubject()

    const document = Automerge.from(entry)
    const binary = Automerge.save(document)
    await this.idb.set(entry.id, binary)
    return binary
  }

  async update(id: string, slice: Partial<Todo>) {
    this.lokiCollection
      .chain()
      .find({ id })
      .update((item: Todo) => Object.assign(item, slice))
    this.reloadSubject()

    const binary = await this.idb.get(id)
    const nextBinary = update(binary, slice)
    await this.idb.set(id, nextBinary)
  }

  async set(binary: Uint8Array) {
    const todo = deserialize(binary) as Todo
    this.lokiCollection.update(todo)
    this.reloadSubject()
    await this.idb.set(todo.id, binary)
  }

  async get(id: string) {
    return this.idb.get(id)
  }

  private reloadSubject() {
    const items = this.lokiCollection
      .chain()
      .data({ removeMeta: true }) as Todo[]
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
    return new this(loki.getCollection(COLLECTION_NAME), idb)
  }
}
