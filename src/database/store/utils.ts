import { Storage } from "~/database/store/storage";
import { EntityOptions, Entry } from "~/database/types";
import { deserialize } from "~/database/automerge";

export const createDocumentsMap = async <T extends Entry>(
  storage: Storage,
  options: EntityOptions<T>
) => {
  const binaryList = await storage.list();
  const items = binaryList.map((binary) => {
    const document = deserialize<T>(binary);
    return [document[options.primaryKey], document] as const;
  });
  return new Map(items);
};
