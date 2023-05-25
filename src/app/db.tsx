import { useEffect, useState } from 'react'

import { RxDBLoader } from '~/core/loaders/rxdb'
import { bootstrap } from '~/core/model/bootstrap'

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
    databaseName: 'pie',
    createLoader: (options, changeStream) =>
      RxDBLoader.create(options, changeStream),
  })
}
