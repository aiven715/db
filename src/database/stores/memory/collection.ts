import { Schema, Entry, Query } from "~/database/types";
import { NotFoundError } from "~/database/errors";

import { Indexes } from "./indexes";
import { filterByPrimaryKey, process } from "./query";
import { Box } from "~/database/box";

/**
 * 1. Implement read/write in-memory store
 *  - Filtering
 *  - Sorting
 *  - Limit
 *  - Offset
 *  - Indexes
 *  - Result - One/Many
 *  Questions:
 *    - How to guarantee deterministic order of results?
 *    - How to make queries efficient?
 *    - How to leverage indexes?
 * 2. Implement observing query changes (should be in a separate class or even module?)
 * 3. Implement replicating changes to other stores (push)
 * 4. Implement loading and merging changes from other stores (pull)
 * 4. Cache queries
 */
// TODO: document object should be get Proxy to allow for reactive field-level updates
// in React components. In that case we won't need a separate Reactive cache for the Model React integration and auto-saves.
export class MemoryStoreCollection<T extends Entry = Entry> {
  private documents: Map<string, T> = new Map();
  private indexes: Indexes<T>;
  private all: string[] = [];

  constructor(private schema: Schema<T>, items?: T[]) {
    this.indexes = new Indexes(schema.indexes);
    if (items) {
      for (const item of items) {
        const identifier = item[this.schema.primaryKey] as string;
        this.all.push(identifier);
        this.documents.set(identifier, item);
        this.indexes.add(item, this.schema.primaryKey);
      }
    }
  }

  list(query: Query<T> = {}) {
    const filterKeys = Object.keys(query.filter || {}) as (keyof T)[];
    const hasOneFilter = filterKeys.length === 1;
    const filterKey = filterKeys[0];
    const isPrimaryKeyFilter = !!query.filter?.[this.schema.primaryKey];

    if (isPrimaryKeyFilter) {
      return new Box(
        filterByPrimaryKey(query, this.documents, this.schema.primaryKey)
      );
    }

    const filterValue = query.filter?.[filterKey];
    const useIndex =
      hasOneFilter && filterValue && this.indexes.has(filterKey, filterValue);

    const identifiers = useIndex
      ? this.indexes.identifiers(filterKey, filterValue)
      : this.all;

    return new Box(process(query, this.documents, identifiers));
  }

  get(identifier: string) {
    const document = this.documents.get(identifier);
    if (!document) {
      throw new NotFoundError(identifier);
    }
    return new Box(document);
  }

  create(document: T) {
    const identifier = document[this.schema.primaryKey] as string;
    if (!this.all.includes(identifier)) {
      this.all.push(identifier);
    }
    this.documents.set(identifier, document);
    this.indexes.add(document, this.schema.primaryKey);
    return new Box(void 0);
  }

  update(identifier: string, change: Partial<T>) {
    const document = this.documents.get(identifier);
    if (!document) {
      throw new NotFoundError(identifier);
    }
    Object.assign(document, change);
    this.indexes.remove(identifier);
    this.indexes.add(document, this.schema.primaryKey);
    return new Box(void 0);
  }

  remove(identifier: string) {
    this.documents.delete(identifier);
    this.indexes.remove(identifier);
    this.all.splice(this.all.indexOf(identifier), 1);
    return new Box(void 0);
  }
}

// Sorting and Filtering               -> Filter first, then sort
// Sorting, Filtering and Limit/Offset -> Filter first, then sort, then limit/offset
// Filtering and Limit/Offset          -> Limit/Offset first, then filter
// Sorting and Limit/Offset            -> Sort first, then limit/offset

/**
 * ### Collection
 * - Has Reactive store module
 *
 * ### Reactive store
 * - Has Store module
 *
 * ### Store
 * - Has Sync module
 * - Has Plugins module (for cross-tab sync etc.)
 * - Update api (to allow field-level updates in Automerge without having to make a diff)
 *
 * #### InMemory
 * Store implements Store
 * - Decorates InMemoryStore which implements Store
 * - IndexedDB storage implements Storage
 * - Keeps InMemoryStore in sync with IndexedDB storage
 * - Has Scheduler
 * ##### Scheduler
 * - Will make sure we debounce writes to avoid growing document log too fast (ex. when user types)
 *   - Will maintain a slice of recent changed fields (when user quickly changes multiple fields)
 * - Will make sure writes to IndexedDB are applied in the same order
 */
