// StoreA (InMemory + IndexedDB)
// StoreB (Postgres)
// StoreC (Filesystem)

// The goal is to have ability to use the library with async store (without in-memory)

// Will contain InMemoryStore or PersistentStore
export class ReactiveStore {
  subscribe() {}

  set() {}

  drop() {}
}

// Will contain ReactiveStore
// Schema Validation
// Preloading
class Collection {}

// Collection -> ReactiveStore -> InMemoryStore and/or PersistentStore -> RemoteStore (another peer like tab or device)
