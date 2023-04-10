import { Storage } from "./store/storage";
import { Collection } from "./collection";
import { Props } from "./types";

type Database<K extends string> = {
  collections: { [P in K]: Collection<Props> };
};

export const init = <C extends string[], P extends C[number]>(
  collections: C
) => {
  const database = { collections: {} } as Database<P>;
  for (const collectionName of collections) {
    const storage = new Storage(collectionName);
    database.collections[collectionName as P] = new Collection(storage);
  }
  return database;
};
export { EntityOptions } from "~/database/types";
