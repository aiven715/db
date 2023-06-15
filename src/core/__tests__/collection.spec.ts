import { uuid } from '@automerge/automerge'
import z from 'zod'

import { ChangeStream } from '../change-stream'
import { Collection } from '../collection'
import { LokiJSStore } from '../stores/lokijs'
import { DatabaseOptions } from '../types'

const COLLECTION_NAME = 'requests'

const databaseOptions: DatabaseOptions = {
  name: 'test',
  collections: {
    [COLLECTION_NAME]: {
      primaryKey: 'id',
      schema: z.object({
        id: z.string().default(() => uuid()),
        collectionId: z.string().or(z.null()).default(null),
        method: z.string().default('GET'),
        url: z.string().default(''),
      }),
    },
  },
}

const initialData = {
  [COLLECTION_NAME]: [
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
}

const create = async () => {
  const store = await LokiJSStore.create(databaseOptions, { initialData })
  const changeStream = new ChangeStream()
  return Collection.create(
    store,
    changeStream,
    COLLECTION_NAME,
    databaseOptions.collections.requests
  )
}

describe('notify only affected queries', () => {
  test('update and filter', async () => {
    const collection = await create()

    const todos = collection.list({
      filter: { collectionId: '1' },
    })
    const posts = collection.list({
      filter: { collectionId: '2' },
    })

    const todosQuerySpy = jest.fn()
    const postsQuerySpy = jest.fn()

    todos.asObservable().subscribe(todosQuerySpy)
    posts.asObservable().subscribe(postsQuerySpy)

    await collection.update({ url: 'foo' }, { filter: { id: '1' } })

    expect(todosQuerySpy).toHaveBeenCalledTimes(2)
    expect(postsQuerySpy).toHaveBeenCalledTimes(1)
  })
})
