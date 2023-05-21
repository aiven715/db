import { uuid } from '@automerge/automerge'
import ReactDOM from 'react-dom/client'
import z from 'zod'

import { Root, StateProvider } from '~/app/components/Root'
import { DatabaseBootstrap } from '~/app/db'
import { RxDBLokiJSStore } from '~/core/plugins/rxdb/store'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <DatabaseBootstrap>
    <StateProvider>
      <Root />
    </StateProvider>
  </DatabaseBootstrap>
)

// RxDBLokiJSStore.create({
//   name: 'pie.db',
//   collections: {
//     requestspecs: {
//       primaryKey: 'id',
//       schema: z.object({
//         id: z.string().default(() => uuid()),
//         collectionId: z.string().or(z.null()).default(null),
//         name: z.string(),
//         method: z.string().default('GET'),
//         url: z.string().default(''),
//       }),
//       migrations: new Array(15).fill(null),
//     },
//   },
// }).then((store) => {
//   store
//     .list('requestspecs', {
//       limit: 20,
//       sort: { key: 'orderKey', direction: 'asc' },
//     })
//     .then((list) => {
//       console.log(list)
//     })
// })
