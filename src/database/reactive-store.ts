// StoreA (InMemory + IndexedDB)
// StoreB (Postgres)
// StoreC (Filesystem)

// The goal is to have ability to use the library with async store (without in-memory)

// Will contain InMemoryStore or PersistentStore
import { Observable, Subject } from "rxjs";
import { Entry, Query, Store } from "./types";
import { Box } from "./box";
import { Result } from "./result";

export class ReactiveStore {
  private streams = new Map<string, ListStream>();

  constructor(private store: Store) {}

  observe<T extends Entry>(id: string): Observable<T>;
  observe<T extends Entry, P extends keyof T>(
    id: string,
    path: P
  ): Observable<T[P]>;
  observe<T extends Entry, P extends string[]>(
    id: string,
    path: P
  ): Observable<Path<T, P>>;
  observe(id: string, path?: string | string[]): Observable<unknown> {}

  list(collection: string, query?: Query): Result<Entry[]> {
    const observable = this.acquireListStream(collection).observable;
    return new Result(observable);
  }

  get(collection: string, id: string): Result<Entry> {}

  create<T extends Entry>(collection: string, document: T): Box<void> {}

  update(collection: string, id: string, document: Partial<Entry>): Box<void> {}

  remove(collection: string, id: string): Box<void> {}

  private acquireListStream(collection: string, query?: Query) {
    const key = this.identifyQuery(query);
    let stream = this.streams.get(key);
    if (!stream) {
      stream = new ListStream(this.store, collection, query);
      this.streams.set(key, stream);
    }
    return stream;
  }

  private identifyQuery(query?: Query): string {
    // TODO: produce the same string regardless of the order of keys
    return JSON.stringify(query);
  }
}

class ListStream {
  private subject: Subject<Entry[]>;

  get observable() {
    return this.subject.asObservable();
  }

  constructor(store: Store, collection: string, query?: Query) {
    this.subject = new Subject();
    store.list(collection, query).then((items) => this.subject.next(items));
  }
}

type Path<T, P extends string[]> = P extends [infer K, ...infer Rest]
  ? K extends keyof T
    ? Rest extends string[]
      ? Path<T[K], Rest>
      : T[K]
    : never
  : T;

// Will contain ReactiveStore
// Schema Validation
// Preloading
class Collection {}

// Collection -> ReactiveStore -> InMemoryStore and/or PersistentStore -> RemoteStore (another peer like tab or device)
