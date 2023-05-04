import z from "zod";

import { MemorySyncStore } from "./core/stores/memory-sync";
import { IndexedDBStore } from "./core/stores/indexeddb";
import { create } from "./core";
import { createContext, useContext, useEffect, useState } from "react";

async function createDatabase() {
  return await create(
    {
      name: "app",
      schemas: {
        todos: {
          version: 0,
          primaryKey: "id",
          // indexes: ["title", "completed"],
          definition: z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
          }),
        },
      },
    },
    async (options) =>
      await MemorySyncStore.init(options, await IndexedDBStore.init(options))
  );
}

type Database = Awaited<ReturnType<typeof createDatabase>>;

const DatabaseContext = createContext(null! as Database);

export const useDatabase = () => {
  return useContext(DatabaseContext);
};

export const DatabaseProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [database, setDatabase] = useState<Database | null>(null);

  useEffect(() => {
    createDatabase().then(setDatabase);
  }, []);

  if (!database) {
    return null;
  }

  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};
