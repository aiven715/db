import { Observable, switchMap } from "rxjs";
import { fromPromise } from "rxjs/internal/observable/innerFrom";

import { Storage } from "./store/storage";
import { Props } from "./types";
import { serialize, deserialize, update } from "./automerge";
import { State } from "./state";

export class Collection<T extends Props> {
  private state = new State();

  constructor(private storage: Storage) {}

  query(): Observable<T[]> {
    return this.state.stream.pipe(
      switchMap(() => {
        const promise = this.storage
          .list()
          .then((binaries) => binaries.map((binary) => deserialize<T>(binary)));
        return fromPromise(promise);
      })
    );
  }

  async create(value: T) {
    const binary = serialize(value);
    await this.storage.set(value.id, binary);
    this.state.ping();
  }

  async update(id: string, value: Partial<T>) {
    const binary = await this.storage.get(id);
    const nextBinary = update(binary, value);
    await this.storage.set(id, nextBinary);
    this.state.ping();
  }

  async remove(id: string): Promise<void> {
    await this.storage.remove(id);
    this.state.ping();
  }
}
