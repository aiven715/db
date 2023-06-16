import { uuid } from '@automerge/automerge'
import { useEffect, useState } from 'react'

import { Entry } from '~/demo/types'

import { Client } from './index'

export const useClient = (id: number) => {
  const [entries, setEntries] = useState<Entry[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    ;(async () => {
      const client = await Client.create(id, {
        onConnect: () => setIsOnline(true),
        onDisconnect: () => setIsOnline(false),
      })
      const entries = await client.store.list()
      setClient(client)
      setEntries(entries)
    })()
  }, [id])

  return {
    client,
    isOnline,
    entries,
    async create(title: string, description: string) {
      const entry = {
        id: uuid(),
        title,
        description,
        version: 0,
      }
      setEntries((entries) => [...entries, entry])
      return client?.store.create(entry)
    },
  }
}
