import { uuid } from '@automerge/automerge'

import { useAppState } from '~/app/components/Root'
import { useModel } from '~/core/model/react/hooks'
import { useIds } from '~/core/model/react/hooks/useIds'

import { Collection } from '../models/collection'
import { RequestSpec } from '../models/requestspec'

export const Sidebar = () => {
  return (
    <div className='w-64 py-2 px-4 mr-4 border-r border-gray-500 h-screen overflow-y-auto'>
      <div className='pb-2 mb-2 border-b border-gray-500'>
        <button
          onClick={() => {
            const name = prompt('Enter collection name')
            if (name) {
              Collection.create({ id: uuid(), name })
            }
          }}
        >
          + Add new collection
        </button>
      </div>
      <CollectionList />
    </div>
  )
}

const CollectionList = () => {
  const collectionIds = useIds('collectionIds', () => Collection.list(), [])
  return (
    <div>
      {collectionIds.map((collectionId) => (
        <CollectionItem key={collectionId} collectionId={collectionId} />
      ))}
      <>
        <div className='flex items-center py-1 px-2 rounded bg-gray-800 mb-2'>
          Drafts
        </div>
        <RequestSpecList />
      </>
    </div>
  )
}

type CollectionItemProps = {
  collectionId: string
}

const CollectionItem = ({ collectionId }: CollectionItemProps) => {
  const collection = useModel(
    'collection',
    () => Collection.get(collectionId),
    [collectionId]
  )
  return (
    <div className='mb-4'>
      <div className='flex items-center py-1 px-2 rounded bg-gray-800 mb-2'>
        {collection.fields.name}
        <div className='ml-auto text-xs'>
          <button
            onClick={() => {
              const name = prompt('Enter collection name')
              if (name) {
                collection.setName(name)
                collection.save()
              }
            }}
          >
            [e]
          </button>
          <button onClick={() => collection.remove()}>[x]</button>
        </div>
      </div>
      <RequestSpecList collectionId={collection.id} />
    </div>
  )
}

type RequestSpecListProps = {
  collectionId?: string
}

const RequestSpecList = ({ collectionId }: RequestSpecListProps) => {
  const requestSpecIds = useIds(
    'specIdsByCollection',
    () => RequestSpec.list({ filter: { collectionId: collectionId || null } }),
    [collectionId]
  )

  return (
    <div className='pl-3'>
      {requestSpecIds.map((requestSpecId) => (
        <RequestSpecItem key={requestSpecId} requestSpecId={requestSpecId} />
      ))}
      <div>
        <button
          onClick={() => {
            const name = prompt('Enter request name')
            if (name) {
              RequestSpec.create({
                collectionId: collectionId || null,
                name,
                body: {
                  text: {
                    value: '',
                  },
                },
              })
            }
          }}
        >
          + Add new {collectionId ? 'request' : 'draft'}
        </button>
      </div>
    </div>
  )
}

const RequestSpecItem = ({ requestSpecId }: { requestSpecId: string }) => {
  const { state, setState } = useAppState()
  const isSelected = state.selectedRequestSpecId === requestSpecId
  const requestSpec = useModel(
    'requestSpec',
    () => RequestSpec.get(requestSpecId),
    [requestSpecId]
  )

  return (
    <div
      className={`flex items-center px-2 rounded cursor-pointer my-2 ${
        isSelected ? 'bg-gray-200 text-black' : 'hover:bg-gray-800'
      }`}
      onClick={() => setState({ selectedRequestSpecId: requestSpecId })}
    >
      {!requestSpec.fields.name ? (
        <span className='text-gray-500'>Untitled</span>
      ) : (
        requestSpec.fields.name
      )}

      <div className='ml-auto'>
        <button
          onClick={(e) => {
            e.stopPropagation()
            requestSpec.remove()
          }}
        >
          ⨉
        </button>
      </div>
    </div>
  )
}
