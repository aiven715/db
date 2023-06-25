import { uuid } from '@automerge/automerge'
import { useEffect, useState } from 'react'

import { sleep } from '~/library/utils'

import { Todo } from '../types'

import { Client } from './index'

export const useClient = (id: number) => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [client, setClient] = useState<Client | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    let client: Client | null = null
    ;(async () => {
      client = await Client.create(id, {
        onConnect: () => setIsOnline(true),
        onDisconnect: () => setIsOnline(false),
      })
      await sleep(100)
      client.sync.start()
      setClient(client)
      client.list().subscribe(setTodos)
    })()
    return () => client?.sync.stop()
  }, [id])

  return {
    client,
    isOnline,
    todos,
    async create(title: string, description: string) {
      const entry = {
        id: uuid(),
        updatedAt: null,
        title,
        description,
      }
      return client?.create(entry)
    },
    async update(id: string, slice: Partial<Todo>) {
      return client?.update(id, slice)
    },
  }
}
