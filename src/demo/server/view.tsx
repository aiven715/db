import { useState } from 'react'

import { useServer } from '~/demo/server/hooks'

import { Entry } from '../types'

export const ServerView = () => {
  const [documents, setDocuments] = useState<Entry[]>([])
  const { isOnline, clients, server } = useServer()

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
              onClick={() => (isOnline ? server!.stop() : server!.start())}
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
                title
              </th>
              <th className='pl-3 text-left pb-2 border-r border-dashed'>
                description
              </th>
              <th className='pl-3 text-left pb-2'>version</th>
            </tr>
          </thead>
          <tbody>
            {!documents.length ? (
              <tr>
                <td colSpan={4} className='text-center pt-3'>
                  No documents
                </td>
              </tr>
            ) : (
              documents.map((document) => (
                <tr>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {document.id}
                  </td>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {document.title}
                  </td>
                  <td className='text-left border-r border-dashed pl-3 py-2'>
                    {document.description}
                  </td>
                  <td className='text-left pl-3 py-2'>{document.version}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </>
    </div>
  )
}
