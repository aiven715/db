import { useServer } from '~/demo/server/hooks'

export const ServerView = () => {
  const { todos, isOnline, clients, server } = useServer()

  return (
    <div className='pt-2 pl-4 flex flex-col pr-4'>
      <>
        <div className='mt-0.5 mb-2 flex items-center'>
          <span className='mr-2'>Server</span>
          <span className='ml-2 mr-2'>
            Status:{' '}
            {isOnline ? (
              <>
                <span className='text-green-400'>online</span>
                <span className='ml-2 mr-2'>Connected clients: {clients}</span>
              </>
            ) : (
              <span className='text-red-400'>offline</span>
            )}
          </span>
          <div className='ml-auto'>
            <button
              onClick={() =>
                isOnline ? server!.sync.stop() : server!.sync.start()
              }
              className='px-2 py-1 bg-gray-800 hover:bg-gray-900 rounded'
            >
              Go {isOnline ? 'offline' : 'online'}
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr className='border-b border-dashed'>
              <th className='pl-3 text-left pb-2 border-r border-dashed'>id</th>
              <th className='pl-3 text-left pb-2 border-r border-dashed'>
                updatedAt
              </th>
              <th className='pl-3 text-left pb-2 border-r border-dashed'>
                title
              </th>
              <th className='pl-3 text-left pb-2'>description</th>
            </tr>
          </thead>
          <tbody>
            {!todos.length ? (
              <tr>
                <td colSpan={4} className='text-center pt-3'>
                  No documents
                </td>
              </tr>
            ) : (
              todos.map((todo) => (
                <tr key={todo.id}>
                  <td className='w-24 text-left border-r border-dashed pl-3 py-2'>
                    <span className='w-24 block overflow-hidden overflow-ellipsis'>
                      {todo.id}
                    </span>
                  </td>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {todo.updatedAt}
                  </td>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {todo.title}
                  </td>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {todo.description}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </>
    </div>
  )
}
