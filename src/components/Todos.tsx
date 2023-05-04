import { uuid } from "@automerge/automerge";
import { useObservable } from "~/hooks/useObservable";
import { useDatabase } from "~/db";

export const Todos = () => {
  const database = useDatabase();
  const todos = useObservable(
    () => database.collections.todos.list().asObservable(),
    []
  );

  return (
    <div className="font-mono text-white max-w-xl mx-auto pt-12">
      {todos?.map((todo) => (
        <div
          key={todo.id}
          className="py-2 border-b-2 border-white border-dashed flex items-center"
        >
          <input
            type="text"
            placeholder="Enter todo text"
            className="bg-transparent outline-none w-full py-2"
            defaultValue={todo.text}
            onChange={(e) =>
              database.collections.todos.update(todo.id, {
                text: e.target.value,
              })
            }
          />
          <span
            className="ml-auto cursor-pointer"
            onClick={() => database.collections.todos.remove(todo.id)}
          >
            ❌
          </span>
        </div>
      ))}
      <input
        type="text"
        placeholder="Enter todo text"
        className="bg-transparent outline-none w-full py-4"
        autoFocus
        onKeyDown={(e: any) => {
          const text = e.target.value;
          if (e.key === "Enter" && text) {
            database.collections.todos
              .create({
                id: uuid(),
                text: e.target.value,
                completed: false,
              })
              .then(() => {
                e.target.value = "";
              });
          }
        }}
      />
    </div>
  );
};
