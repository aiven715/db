import { uuid } from '@automerge/automerge'

import { useObservable } from '../hooks/useObservable'
import { Todo } from '../models/todo'

export const Todos = () => {
  // useModels.
  // whether notify on single item change or not, should be configurable
  const todos = useObservable(() => Todo.list().asObservable(), [])

  return (
    <div className='font-mono text-white max-w-xl mx-auto pt-12'>
      {todos?.map((todo) => (
        <div
          key={todo.id}
          className='py-2 border-b-2 border-white border-dashed flex items-center'
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
