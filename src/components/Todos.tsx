import { createTodo, listTodos, removeTodo, renameTodo } from "~/entities/todo";
import { useObservable } from "~/hooks/useObservable";

export const Todos = () => {
  const todos = useObservable(() => listTodos(), []);

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
            onChange={(e) => renameTodo(todo.id, e.target.value)}
          />
          <span
            className="ml-auto cursor-pointer"
            onClick={() => removeTodo(todo.id)}
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
        onKeyDown={async (e: any) => {
          const text = e.target.value;
          if (e.key === "Enter" && text) {
            await createTodo(text);
            e.target.value = "";
          }
        }}
      />
    </div>
  );
};
