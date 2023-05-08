import { useModel } from '~/core/model/react/hooks'

import { Todo } from '../models/todo'

export type TodoProps = {
  todoId: string
}

export const TodoItem = ({ todoId }: TodoProps) => {
  const todo = useModel('todo', () => Todo.get(todoId), [todoId])

  return (
    <div
      key={todo.id}
      className='py-2 border-b-2 border-white border-dashed flex items-center'
      data-id={todo.id}
    >
      <div className='py-2'>{todo.fields.text}</div>
      <div className='ml-auto cursor-pointer flex items-center'>
        <span
          className='mr-2'
          onClick={() => {
            const text = window.prompt()
            if (text) {
              todo.fields.text = text
              todo.save()
            }
          }}
        >
          🖊️
        </span>
        <span onClick={() => Todo.remove(todo.id)}>❌</span>
      </div>
    </div>
  )
}
