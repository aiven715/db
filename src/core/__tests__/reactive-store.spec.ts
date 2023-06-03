import { uuid } from '@automerge/automerge'
import z from 'zod'

import { ChangeStream } from '../change-stream'
import { ReactiveStore } from '../reactive-store'
import { LokiJSStore } from '../stores/lokijs'
import { DatabaseOptions } from '../types'

const databaseOptions: DatabaseOptions = {
  name: 'test',
  collections: {
    requests: {
      primaryKey: 'id',
      schema: z.object({
        id: z.string().default(() => uuid()),
        collectionId: z.string().or(z.null()).default(null),
        method: z.string().default('GET'),
        url: z.string().default(''),
      }),
    },
    collections: {
      primaryKey: 'id',
      schema: z.object({
        id: z.string().default(() => uuid()),
        name: z.string().default(''),
      }),
    },
  },
}

const initialData = {
  requests: [
    {
      id: '1',
      collectionId: '1',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
    },
    {
      id: '2',
      collectionId: '1',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/2',
    },
    {
      id: '3',
      collectionId: '1',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/3',
    },
    {
      id: '4',
      collectionId: '2',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/posts/1',
    },
  ],
  collections: [
    {
      id: '1',
      name: 'todos',
    },
    {
      id: '2',
      name: 'posts',
    },
  ],
}

const create = async () => {
  const store = await LokiJSStore.create(databaseOptions, { initialData })
  const changeStream = new ChangeStream()
  return new ReactiveStore(store, changeStream)
}

describe('notify only affected queries', () => {
  test('update and filter', async () => {
    const reactiveStore = await create()

    const todos = reactiveStore.list('requests', {
      filter: { collectionId: '1' },
    })
    const posts = reactiveStore.list('requests', {
      filter: { collectionId: '2' },
    })

    const todosQuerySpy = jest.fn()
    const postsQuerySpy = jest.fn()

    todos.asObservable().subscribe(todosQuerySpy)
    posts.asObservable().subscribe(postsQuerySpy)

    await reactiveStore.update(
      'requests',
      { url: 'foo' },
      { filter: { id: '1' } }
    )

    expect(todosQuerySpy).toHaveBeenCalledTimes(2)
    expect(postsQuerySpy).toHaveBeenCalledTimes(1)
  })
})
