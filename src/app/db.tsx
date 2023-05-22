import { useEffect, useState } from 'react'

import { bootstrap } from '~/core/model/bootstrap'
import { RxDBLokiJSStore } from '~/core/plugins/rxdb/store'

// import { IndexedDBStore } from '~/core/stores/indexeddb'
// import { MemorySyncStore } from '~/core/stores/memory-sync'

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
    databaseName: 'pie.db',
    createStore: async (options) => await RxDBLokiJSStore.create(options),
    // createStore: async (options) =>
    //   await MemorySyncStore.create(
    //     options,
    //     await IndexedDBStore.create(options)
    //   ),
  })
}
