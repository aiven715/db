import { useEffect, useState } from 'react'

import { bootstrap } from '~/core/model/bootstrap'
import { IndexedDBStore } from '~/core/stores/indexeddb'
import { MemorySyncStore } from '~/core/stores/memory-sync'

import { Todo } from './models/todo'

export const DatabaseBootstrap = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    init().then(() => setInitialized(true))
  }, [])

  if (!initialized) {
    return null
  }

  return <>{children}</>
}

async function init() {
  await bootstrap({
    databaseName: 'app',
    createStore: async (options) =>
      await MemorySyncStore.create(
        options,
        await IndexedDBStore.create(options)
      ),
  })
  // const [todo] = Todo.list().asValue();
  // console.log(todo);
}
