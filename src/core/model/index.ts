import { DeepPartial } from "~/library";

import { Entry, Query, Schema } from "../types";
import { DATABASE_GLOBAL_KEY } from "./bootstrap";
import { createFieldsProxy } from "./fields";

export class Model<T extends Entry> {
  static collectionName: string;
  static schema: Schema;
  static primaryKey = "id";
  static version = 0;

  fields: T;
  #patch: DeepPartial<T> = {};

  constructor(fields: T) {
    this.fields = createFieldsProxy(fields, this.#patch);
  }

  get id() {
    return this.fields[this.class.primaryKey] as string;
  }

  save() {
    return this.class.collection.update(this.id, this.#patch).then(() => {
      this.#patch = {};
    });
  }

  remove() {
    return this.class.collection.remove(this.id);
  }

  protected get class() {
    return this.constructor as typeof Model;
  }

  protected static get collection() {
    return this.database.collections[this.collectionName];
  }

  private static get database() {
    const database = window[DATABASE_GLOBAL_KEY];
    if (!database) {
      throw new Error("Database not found");
    }
    return database;
  }

  static get<T extends Entry, M extends typeof Model<T>>(this: M, id: string) {
    return this.collection
      .get(id)
      .map((fields) => new this(fields as T) as InstanceType<M>);
  }

  static list<T extends Entry, M extends typeof Model<T>>(
    this: M,
    query?: Query
  ) {
    return this.collection
      .list(query)
      .map((items) =>
        items.map((fields) => new this(fields as T) as InstanceType<M>)
      );
  }

  static create<T extends Entry, M extends typeof Model<T>>(
    this: M,
    fields: T
  ) {
    return this.collection.create(fields);
  }

  static remove(id: string) {
    return this.collection.remove(id);
  }
}
