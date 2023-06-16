import { useEffect, useState } from 'react'

import { Server } from './index'

export const useServer = () => {
  const [clients, setClients] = useState<number>(0)
  const [server, setServer] = useState<Server | null>(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    Server.create({
      onClientsChange: (clients) => setClients(clients.length),
      onStart: () => setIsOnline(true),
      onStop: () => setIsOnline(false),
    }).then((server) => {
      server.start()
      setServer(server)
    })
  }, [])

  return { isOnline, clients, server }
}
