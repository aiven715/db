import { Entry, Query, Schema } from "./types";
import { ReactiveStore } from "~/core/reactive-store";

export class Collection<T extends Entry = Entry> {
  constructor(
    private name: string,
    private schema: Schema<T>,
    private reactiveStore: ReactiveStore
  ) {}

  list(query?: Query) {
    return this.reactiveStore.list(this.name, query);
  }

  get(id: string, path?: string | string[]) {
    return this.reactiveStore.get(this.name, id, path);
  }

  create(entry: T) {
    return this.reactiveStore.create(this.name, entry);
  }

  update(id: string, slice: Partial<T>) {
    return this.reactiveStore.update(this.name, id, slice);
  }

  remove(id: string) {
    return this.reactiveStore.remove(this.name, id);
  }
}
