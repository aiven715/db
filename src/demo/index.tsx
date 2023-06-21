import { ClientView } from './client/view'
import { ServerView } from './server/view'

export const App = () => {
  return (
    <>
      <div className='flex flex-col w-1/2 h-screen border-r'>
        <ClientView id={1} />
        {/*<ClientView id={2} />*/}
      </div>
      <div className='w-1/2'>
        <ServerView />
      </div>
    </>
  )
}
