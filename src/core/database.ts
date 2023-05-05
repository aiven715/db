import z from "zod";

import { ReactiveStore } from "./reactive-store";
import { DatabaseOptions, Store } from "./types";
import { Collection } from "./collection";

type CollectionMap<O extends DatabaseOptions> = {
  [K in keyof O["collections"]]: Collection<
    z.infer<O["collections"][K]["schema"]>
  >;
};

export class Database<O extends DatabaseOptions = DatabaseOptions> {
  collections: CollectionMap<O>;

  private constructor(private store: Store, private options: O) {
    this.collections = {} as CollectionMap<O>;
    const reactiveStore = new ReactiveStore(store);
    for (const [name, config] of Object.entries(options.collections)) {
      this.collections[name as keyof CollectionMap<O>] = new Collection(
        name,
        config,
        reactiveStore
      );
    }
  }

  static async create<O extends DatabaseOptions>(
    options: O,
    createStore: (options: O) => Promise<Store>
  ) {
    const store = await createStore(options);
    return new Database(store, options);
  }
}
