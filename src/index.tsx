import ReactDOM from 'react-dom/client'

// import { Bootstrap } from '~/app/bootstrap'
// import { Root, StateProvider } from '~/app/components/Root'
import { App } from './demo'

const root = ReactDOM.createRoot(document.getElementById('root')!)

root.render(
  <div className='flex items-start text-white font-mono'>
    <App />
    {/*<Bootstrap>*/}
    {/*  <StateProvider>*/}
    {/*    <Root />*/}
    {/*  </StateProvider>*/}
    {/*</Bootstrap>*/}
  </div>
)
