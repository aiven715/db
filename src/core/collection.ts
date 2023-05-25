import { ReactiveStore } from './reactive-store'
import { Result } from './result'
import { CollectionConfig, Entry, Query, Sync } from './types'

export class Collection<T extends Entry = Entry> {
  constructor(
    private name: string,
    private config: CollectionConfig<T>,
    private reactiveStore: ReactiveStore,
    public sync?: Sync
  ) {}

  list(query?: Query) {
    return this.reactiveStore.list(this.name, query) as Result<T[]>
  }

  get(id: string) {
    return this.reactiveStore.get(this.name, id) as Result<T>
  }

  create(entry: T) {
    const parsed = this.config.schema.parse(entry) as T
    return this.reactiveStore.create(this.name, parsed)
  }

  update(id: string, slice: Partial<T>) {
    const parsed = this.config.schema.partial().parse(slice) as Partial<T>
    return this.reactiveStore.update(this.name, id, parsed)
  }

  remove(id: string) {
    return this.reactiveStore.remove(this.name, id)
  }
}
