// The goal is to have ability to use the library with async store (without in-memory)

import { Subject } from "rxjs";
import { distinctUntilChanged, map } from "rxjs/operators";
import get from "lodash/get";
import isEqual from "lodash/isEqual";
import { Entry, Query, Store } from "./types";
import { Box } from "./box";
import { Result } from "./result";

export class ReactiveStore {
  private queries = new Map<string, Subject<Entry[]>>();
  private entries = new Map<string, Subject<Entry>>();

  constructor(private store: Store) {}

  list(collection: string, query?: Query): Result<Entry[]> {
    const querySubject = this.getOrCreateQuerySubject(collection, query);
    this.store
      .list(collection, query)
      .then((items) => querySubject.next(items));
    return new Result(querySubject.pipe(distinctUntilChanged(isEqual)));
  }

  get(collection: string, id: string, path?: string | string[]) {
    const entrySubject = this.getOrCreateEntrySubject(collection, id);
    this.store.get(collection, id).then((item) => entrySubject.next(item));
    return new Result(
      entrySubject.pipe(
        map((entry) => (path ? get(entry, path) : entry)),
        distinctUntilChanged(isEqual)
      )
    );
  }

  create<T extends Entry>(collection: string, entry: T): Box<void> {
    return this.store
      .create(collection, entry)
      .then(() => this.notifyQueries(collection));
  }

  update(collection: string, id: string, slice: Partial<Entry>): Box<void> {
    return this.store.update(collection, id, slice).then(() => {
      this.notifyQueries(collection);
      this.notifyEntry(collection, id);
    });
  }

  remove(collection: string, id: string): Box<void> {
    return this.store
      .remove(collection, id)
      .then(() => this.notifyQueries(collection));
  }

  private notifyQueries(collection: string) {
    for (const [key, subject] of this.queries) {
      const [keyCollection, queryStr] = key.split(":");
      if (keyCollection === collection) {
        const query = queryStr ? JSON.parse(queryStr) : undefined;
        this.store.list(collection, query).then((items) => subject.next(items));
      }
    }
  }

  private notifyEntry(collection: string, id: string) {
    for (const [key, subject] of this.entries) {
      const [keyCollection, keyId] = key.split(":");
      if (keyCollection === collection && keyId === id) {
        this.store.get(collection, id).then((item) => subject.next(item));
        break;
      }
    }
  }

  private getOrCreateQuerySubject(
    collection: string,
    query?: Query
  ): Subject<Entry[]> {
    const key = this.identifyQuery(collection, query);
    const subject = this.queries.get(key);
    if (subject) {
      return subject;
    }
    const newSubject = new Subject<Entry[]>();
    this.queries.set(key, newSubject);
    return newSubject;
  }

  private getOrCreateEntrySubject(
    collection: string,
    id: string
  ): Subject<Entry> {
    const key = this.identifyEntry(collection, id);
    const subject = this.entries.get(key);
    if (subject) {
      return subject;
    }
    const newSubject = new Subject<Entry>();
    this.entries.set(key, newSubject);
    return newSubject;
  }

  private identifyQuery(collection: string, query?: Query): string {
    // TODO: produce the same string regardless of the order of keys
    if (query) {
      return `${collection}:${JSON.stringify(query)}`;
    }
    return collection;
  }

  private identifyEntry(collection: string, id: string): string {
    return `${collection}:${id}`;
  }
}
