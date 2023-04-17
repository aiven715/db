import { MemorySyncStore } from "./stores/memory-sync";
import { IndexedDBStore } from "~/database/stores/indexeddb";
// import { Collection } from "./collection";
// import { Props } from "./types";

// type Database<K extends string> = {
//   collections: { [P in K]: Collection<Props> };
// };
//
// export const init = <C extends string[], P extends C[number]>(
//   collections: C
// ) => {
//   // const database = { collections: {} } as Database<P>;
//   // for (const collectionName of collections) {
//   //   const storage = new Storage(collectionName);
//   //   database.collections[collectionName as P] = new Collection(storage);
//   // }
//   // return database;
// };

const options = {
  name: "app",
  schemas: {
    todos: {
      version: 0,
      primaryKey: "id",
      indexes: ["title", "completed"],
    },
  },
};

async function main() {
  const store = await MemorySyncStore.init(
    options,
    await IndexedDBStore.init(options)
  );
  store.list("todos").then(console.log);
}

main();
