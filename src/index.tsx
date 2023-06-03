import ReactDOM from 'react-dom/client'

import { Bootstrap } from '~/app/bootstrap'
import { Root, StateProvider } from '~/app/components/Root'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <Bootstrap>
    <StateProvider>
      <Root />
    </StateProvider>
  </Bootstrap>
)
