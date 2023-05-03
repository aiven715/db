import z from "zod";

import { MemorySyncStore } from "./core/stores/memory-sync";
import { IndexedDBStore } from "./core/stores/indexeddb";
import { create } from "./core";
import { createContext, useContext, useEffect, useState } from "react";
import { Entry } from "~/core/types";

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
            id_: z.string(),
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

type Schema_<D extends z.ZodObject<z.ZodRawShape>> = {
  primaryKey: keyof z.infer<D>;
  definition: D;
};

const handleSchemas = <
  S extends {
    [K in string]: S[K] extends Schema_<infer D> ? "a" : never;
  }
>(
  schemas: S
) => {};

handleSchemas({
  todos: {
    // Doest not raise a type error. Should allow only keys of the definition
    primaryKey: "id",
    definition: z.object({
      id: z.string(),
      text: z.string(),
      completed: z.boolean(),
    }),
  },
});
