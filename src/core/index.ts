import { DatabaseOptions, Store } from "~/core/types";
import { ReactiveStore } from "~/core/reactive-store";
import { Database } from "~/core/database";

export const create = async <O extends DatabaseOptions>(
  options: O,
  createStore: (options: O) => Promise<Store>
) => {
  const store = await createStore(options);
  const reactiveStore = new ReactiveStore(store);
  return new Database(reactiveStore, options);
};
