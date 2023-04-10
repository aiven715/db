import { uuid } from "@automerge/automerge";

import { Collection } from "~/database/collection";

import { database } from "./";

const collection = database.collections.todos as Collection<Todo>;

export type Todo = {
  id: string;
  text: string;
};

export const listTodos = () => {
  return collection.query();
};

export const createTodo = async (text: string) => {
  const todo: Todo = { id: uuid(), text };
  await collection.create(todo);
};

export const renameTodo = async (id: string, text: string) => {
  await collection.update(id, { text });
};

export const removeTodo = async (id: string) => {
  await collection.remove(id);
};
