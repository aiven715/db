import z from "zod";

import { Box } from "./box";

export interface Props {
  id: string;
  [key: string]: unknown;
}

export type Identifier = string;

export type Entry = Record<string, unknown>;

export type Query<T extends Entry = Entry> = {
  filter?: Partial<T>;
  sort?: { key: keyof T; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
};

export interface Store {
  list(collection: string, query?: Query): Box<Entry[]>;
  get(collection: string, identifier: string): Box<Entry>;
  create(collection: string, document: Entry): Box<void>;
  update(
    collection: string,
    identifier: string,
    document: Partial<Entry>
  ): Box<void>;
  remove(collection: string, identifier: string): Box<void>;
}

export interface Sync {}

export type DatabaseOptions = {
  name: string;
  schemas: Record<string, Schema>;
};

export type Schema<T extends Entry = Entry> = {
  primaryKey: keyof T;
  version: number;
  definition: z.ZodObject<z.ZodRawShape>;
  indexes?: (keyof T)[];
  // migrations: [];
};
