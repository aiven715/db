import { ReactiveStore } from "./reactive-store";
import { DatabaseOptions } from "./types";
import { Collection } from "./collection";

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O["schemas"]]: Collection;
};

export class Database<O extends DatabaseOptions = DatabaseOptions> {
  collections: CollectionMap<O>;

  constructor(private reactiveStore: ReactiveStore, private options: O) {
    this.collections = {} as CollectionMap<O>;
    for (const [name, schema] of Object.entries(options.schemas)) {
      this.collections[name as keyof CollectionMap<O>] = new Collection(
        name,
        schema,
        reactiveStore
      );
    }
  }
}
