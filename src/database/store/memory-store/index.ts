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
import { Indexes } from "./indexes";
import { filterByPrimaryKey, process } from "./query";
import { EntityOptions, Entry, Query, Store } from "../../types";
import { NotFoundError } from "../../errors";

export class MemoryStore<T extends Entry> implements Store<T> {
  private documents: Map<string, T> = new Map();
  private indexes = new Indexes<T>(this.options.indexes);
  private all: string[] = [];

  constructor(private options: EntityOptions<T>) {}

  list(query: Query<T> = {}): T[] {
    const filterKeys = Object.keys(query.filter || {}) as (keyof T)[];
    const hasOneFilter = filterKeys.length === 1;
    const filterKey = filterKeys[0];
    const isPrimaryKeyFilter = !!query.filter?.[this.options.primaryKey];

    if (isPrimaryKeyFilter) {
      return filterByPrimaryKey(query, this.documents, this.options.primaryKey);
    }

    const filterValue = query.filter?.[filterKey];
    const useIndex =
      hasOneFilter && filterValue && this.indexes.has(filterKey, filterValue);

    const identifiers = useIndex
      ? this.indexes.identifiers(filterKey, filterValue)
      : this.all;

    return process(query, this.documents, identifiers);
  }

  create(document: T) {
    const primaryValue = document[this.options.primaryKey] as string;
    if (!this.all.includes(primaryValue)) {
      this.all.push(primaryValue);
    }
    this.documents.set(primaryValue, document);
    this.indexes.add(document, this.options.primaryKey);
  }

  update(identifier: string, change: Partial<T>) {
    const document = this.documents.get(identifier);
    if (!document) {
      throw new NotFoundError(identifier);
    }
    Object.assign(document, change);
    this.indexes.remove(identifier);
    this.indexes.add(document, this.options.primaryKey);
  }

  remove(identifier: string) {
    this.documents.delete(identifier);
    this.indexes.remove(identifier);
    this.all.splice(this.all.indexOf(identifier), 1);
  }
}

// Sorting and Filtering               -> Filter first, then sort
// Sorting, Filtering and Limit/Offset -> Filter first, then sort, then limit/offset
// Filtering and Limit/Offset          -> Limit/Offset first, then filter
// Sorting and Limit/Offset            -> Sort first, then limit/offset

/**
 * ### Collection
 * - Has Reactive module
 *
 * ### Reactive
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
