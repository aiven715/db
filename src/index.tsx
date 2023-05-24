import ReactDOM from 'react-dom/client'

import { Root, StateProvider } from '~/app/components/Root'
import { DatabaseBootstrap } from '~/app/db'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <DatabaseBootstrap>
    <StateProvider>
      <Root />
    </StateProvider>
  </DatabaseBootstrap>
)
