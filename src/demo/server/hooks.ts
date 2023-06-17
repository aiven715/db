import { useEffect, useState } from 'react'

import { Todo } from '../types'

import { Server } from './index'

export const useServer = () => {
  const [todos, setTodos] = useState<Todo[]>([])
  const [clients, setClients] = useState<number>(0)
  const [server, setServer] = useState<Server | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    let server: Server | null = null
    ;(async () => {
      server = await Server.create({
        onClientsChange: (clients) => setClients(clients.length),
        onStart: () => setIsOnline(true),
        onStop: () => setIsOnline(false),
      })
      server.sync.start()
      setServer(server)
      server.list().subscribe(setTodos)
    })()
    return () => server?.sync.stop()
  }, [])

  return { todos, isOnline, clients, server }
}
