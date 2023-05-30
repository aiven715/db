import { useEffect, useState } from 'react'

import { RxDBLoader } from '~/core/loaders/rxdb'
import { RxDBEntry } from '~/core/loaders/rxdb/types'
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
  const { database } = await bootstrap({
    databaseName: 'pie',
    createLoader: (changeStream, options) =>
      RxDBLoader.create(changeStream, options, {
        pull: (collection: string) => async (lastSynced: RxDBEntry | null) => {
          const TOKEN =
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkN4bUNXVlRsTHltRDBaVXJvVHhBSiJ9.eyJpc3MiOiJodHRwczovL2h0dHBpZS1kZXYudXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw0NDQwMjQ4OSIsImF1ZCI6WyJwaWUtYXBwIiwiaHR0cHM6Ly9odHRwaWUtZGV2LnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2ODU0MzI1MzIsImV4cCI6MTY4ODAyNDUzMiwiYXpwIjoiY1hmem9Cc0c4dkM4NFJqRGkyWVdGSmFMZlVFN2dtQVQiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIn0.TeUBKgIKaXPeelYmJP-uDcmSeGZqLykEjT9mQ5zkJkTX80rafhLqiyVXZW8fM1Fg-YwqjiIEzandj8z8nMWYZebcukNfCqw1g7dkW1RKwDqOIxOjyao_PczEWqCFPuSARBy13_B7Xv6UY36ci0yYI8QGdyD5YUx_YeT4EFabtswkWoAJiXtp-NGsPDsJxhXq7wVlYkTItQ4m6enMeEAgdMYeAzbdoCtUhdTA89P74OChSXBh0n5eyXhZYcXmEiRqs06G68Tl-M_V75BSBg1Wb97khYUi1yYiymSSU5_-8SsYp-ZSUzkbdfwdBPh63527Gef1OAnauCs4ogm21NFvTg'
          const MIN_UPDATED_AT = lastSynced?.updatedAt
          const LAST_ID = lastSynced?.id

          const url = new URL(`http://localhost:3030/api/${collection}`)
          if (MIN_UPDATED_AT) {
            url.searchParams.append('minUpdatedAt', MIN_UPDATED_AT.toString())
          }
          if (LAST_ID) {
            url.searchParams.append('lastId', LAST_ID)
          }

          const res = await fetch(url, {
            headers: {
              'accept': 'application/json',
              'authorization': `Bearer ${TOKEN}`,
              'Httpie-Client': 'Web',
              'Httpie-Client-Api-Version': '6',
              'Httpie-Client-Channel': 'stable',
              'Httpie-Client-Version': '2023.3.0',
            },
          })
          const data = await res.json()
          return {
            documents: data.results,
            hasMoreDocuments: data.hasMore,
          }
        },
        push: (collection: string) => async (documents: RxDBEntry[]) => {
          const url = new URL(`http://localhost:3030/api/${collection}`)
          const TOKEN =
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IkN4bUNXVlRsTHltRDBaVXJvVHhBSiJ9.eyJpc3MiOiJodHRwczovL2h0dHBpZS1kZXYudXMuYXV0aDAuY29tLyIsInN1YiI6ImdpdGh1Ynw0NDQwMjQ4OSIsImF1ZCI6WyJwaWUtYXBwIiwiaHR0cHM6Ly9odHRwaWUtZGV2LnVzLmF1dGgwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2ODU0MzI1MzIsImV4cCI6MTY4ODAyNDUzMiwiYXpwIjoiY1hmem9Cc0c4dkM4NFJqRGkyWVdGSmFMZlVFN2dtQVQiLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG9mZmxpbmVfYWNjZXNzIn0.TeUBKgIKaXPeelYmJP-uDcmSeGZqLykEjT9mQ5zkJkTX80rafhLqiyVXZW8fM1Fg-YwqjiIEzandj8z8nMWYZebcukNfCqw1g7dkW1RKwDqOIxOjyao_PczEWqCFPuSARBy13_B7Xv6UY36ci0yYI8QGdyD5YUx_YeT4EFabtswkWoAJiXtp-NGsPDsJxhXq7wVlYkTItQ4m6enMeEAgdMYeAzbdoCtUhdTA89P74OChSXBh0n5eyXhZYcXmEiRqs06G68Tl-M_V75BSBg1Wb97khYUi1yYiymSSU5_-8SsYp-ZSUzkbdfwdBPh63527Gef1OAnauCs4ogm21NFvTg'

          await fetch(url, {
            headers: {
              'accept': 'application/json',
              'content-type': 'application/json',
              'authorization': `Bearer ${TOKEN}`,
              'Httpie-Client': 'Web',
              'Httpie-Client-Api-Version': '6',
              'Httpie-Client-Channel': 'stable',
              'Httpie-Client-Version': '2023.3.0',
            },
            method: 'POST',
            body: JSON.stringify(documents),
          })
        },
      }),
  })

  database.collections.requestspecs.sync?.start()
}
