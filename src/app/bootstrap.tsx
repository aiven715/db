import React, { useEffect, useState } from 'react'

import { AutomergeLoader } from '~/core/loaders/automerge'
import { bootstrap } from '~/core/model/bootstrap'

export const Bootstrap = ({ children }: { children: React.ReactNode }) => {
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
  const { database } = await bootstrap({
    databaseName: 'pie',
    createLoader: (changeStream, options) =>
      AutomergeLoader.create(changeStream, options),
  })
}
