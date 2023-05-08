import { uuid } from '@automerge/automerge'

import { TodoItem } from '~/app/components/TodoItem'
import { useIds } from '~/core/model/react/hooks'

import { Todo } from '../models/todo'

export const Todos = () => {
  const todoIds = useIds('todoIds', () => Todo.list(), [])

  return (
    <div className='font-mono text-white max-w-xl mx-auto pt-12'>
      {todoIds.map((todoId) => (
        <TodoItem todoId={todoId} key={todoId} />
      ))}
      <input
        type='text'
        placeholder='Enter todo text'
        className='bg-transparent outline-none w-full py-4'
        autoFocus
        onKeyDown={(e: any) => {
          const text = e.target.value
          if (e.key === 'Enter' && text) {
            Todo.create({
              id: uuid(),
              text: e.target.value,
              completed: false,
            }).then(() => {
              e.target.value = ''
            })
          }
        }}
      />
    </div>
  )
}
