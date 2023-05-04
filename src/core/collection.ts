import { Entry, Query, Schema } from "./types";
import { ReactiveStore } from "~/core/reactive-store";
import { Result } from "~/core/result";

// TODO: work with Sync here
// reactive sync - true
// on every change - commit and push
// on start        - pull periodically

// reactive sync - false
// on every change - commit
export class Collection<T extends Entry = Entry> {
  constructor(
    private name: string,
    private schema: Schema<T>,
    private reactiveStore: ReactiveStore
  ) {}

  list(query?: Query) {
    return this.reactiveStore.list(this.name, query) as Result<T[]>;
  }

  get(id: string, path?: string | string[]) {
    return this.reactiveStore.get(this.name, id, path) as Result<T>;
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
