import { Database } from "../database";
import { Query } from "../types";

export class Model {
  static collectionName: string;

  constructor(public fields: any) {}

  static get collection() {
    return this.database.collections[this.collectionName];
  }

  private static get database(): Database {
    // TODO: get database from global scope. (by instance id or just hard coded variable)
    throw new Error("Not implemented");
  }

  static find(query: Query) {
    return this.collection.list(query).map(([fields]) => new this(fields));
  }
}

class Todo extends Model {}

const main = async () => {
  const todo = await Todo.create({ text: "Hello" });
  const todo2 = await Todo.find({ filter: { id: todo.id } }).asPromise();
  todo2.fields.text = "Hello2";
  todo2.save();
};

main();
