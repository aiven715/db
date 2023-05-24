import { useEffect, useState } from 'react'

import { bootstrap } from '~/core/model/bootstrap'

import { RxDBLokiJSStore } from '../core/loaders/rxdb/store'

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
  })
}
