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

// TODO: should return MaybePromise<T> or Box<T> type
export interface Store<T extends Entry> {
  list(query?: Query<T>): T[];
  create(document: T): void;
  update(identifier: string, document: Partial<T>): void;
  remove(identifier: string): void;
}

export type EntityOptions<T extends Entry> = {
  name: string;
  primaryKey: keyof T;
  indexes: (keyof T)[];
};
