import { useMemo, useState } from 'react'

import { useClient } from './hooks'

export const ClientView = ({ id }: { id: number }) => {
  const { client, isOnline, todos, create } = useClient(id)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  )
  const document = useMemo(
    () => todos.find((d) => d.id === selectedDocumentId),
    [todos, selectedDocumentId]
  )

  return (
    <div className='flex-1 flex flex-col border-b pt-2 px-4'>
      <div className='mb-2 flex items-center h-8'>
        <span className='mr-2'>Client #{id}</span>
        {isOnline ? (
          <>
            <span className='ml-2 mr-2'>
              Status: <span className='text-green-400'>online</span>
            </span>
            {document && (
              <>
                <span className='ml-2'>Version: 5</span>
              </>
            )}
          </>
        ) : (
          <>
            <span className='ml-2 mr-2'>
              Status: <span className='text-red-400'>offline</span>
            </span>{' '}
            <span className='ml-2'>
              Un-synced changes: <span className='text-yellow-400'>5</span>
            </span>
          </>
        )}
        <div className='ml-auto'>
          {isOnline ? (
            <button
              onClick={() => {
                const title = prompt('Enter title')
                const description = title && prompt('Enter description')
                if (title && description) {
                  create(title, description)
                }
              }}
              className='text-sm px-2 py-1 bg-gray-800 hover:bg-gray-900 rounded'
            >
              Create document
            </button>
          ) : (
            <button
              onClick={() => {}}
              className='text-sm px-2 py-1 bg-red-800 hover:bg-red-900 rounded'
            >
              Delete local data
            </button>
          )}
        </div>
      </div>
      <div className='w-full'>
        {document ? (
          <>
            <input
              placeholder='Title'
              value={document.title}
              onChange={(e) =>
                client!.update(selectedDocumentId!, { title: e.target.value })
              }
              className='px-2 py-1 mb-4 rounded text-black w-full'
              name='title'
              type='text'
            />
            <textarea
              rows={4}
              value={document.description}
              onChange={(e) =>
                client!.update(selectedDocumentId!, {
                  description: e.target.value,
                })
              }
              placeholder='Description'
              className='px-2 py-1 rounded text-black w-full'
            />
          </>
        ) : (
          <div>No document</div>
        )}
      </div>
      <div className='mt-auto mb-5 flex items-center'>
        <button
          onClick={() =>
            isOnline ? client!.sync.stop() : client!.sync.start()
          }
          className='px-2 py-1 bg-gray-800 hover:bg-gray-900 rounded'
        >
          Go {isOnline ? 'offline' : 'online'}
        </button>
        <select
          value={selectedDocumentId || '0'}
          onChange={(e) => setSelectedDocumentId(e.target.value)}
          className='px-2 py-1 bg-gray-800 hover:bg-gray-900 rounded ml-auto'
        >
          <option value='0' disabled>
            Select document
          </option>
          {todos.map((document) => (
            <option key={document.id} value={document.id}>
              {document.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
