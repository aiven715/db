import { useModel } from '~/core/model/react/hooks'

import { RequestSpec } from '../models/requestspec'

import { useAppState } from './Root'

export function Content() {
  const { state } = useAppState()

  const requestSpec = useModel(
    'requestSpec',
    () => RequestSpec.get(state.selectedRequestSpecId!),
    [state.selectedRequestSpecId]
  )
  return (
    <div className='w-96 mt-2'>
      <div className='text-sm mb-1'>Name</div>
      <input
        className='w-full text-black mb-2 rounded px-1'
        type='text'
        placeholder='Name'
        value={requestSpec.fields.name}
        onChange={(e) => {
          const value = e.target.value
          requestSpec.setName(value)
          requestSpec.save()
        }}
      />
      <div className='text-sm mb-1'>Url</div>
      <input
        className='w-full text-black mb-2 rounded px-1'
        type='text'
        placeholder='Url'
        value={requestSpec.fields.url}
        onChange={(e) => {
          const value = e.target.value
          requestSpec.setUrl(value)
          requestSpec.save()
        }}
      />
      <div className='text-sm mb-1'>Body</div>
      <Body requestSpecId={state.selectedRequestSpecId!} />
    </div>
  )
}

export type BodyProps = {
  requestSpecId: string
}

const Body = ({ requestSpecId }: BodyProps) => {
  const requestSpec = useModel(
    'requestSpec_',
    () => RequestSpec.get(requestSpecId),
    [requestSpecId]
  )
  return (
    <textarea
      className='w-full h-48 text-black rounded p-1'
      placeholder='Body'
      value={requestSpec.fields.body}
      onChange={(e) => {
        const value = e.target.value
        requestSpec.setBody(value)
        requestSpec.save()
      }}
    />
  )
}
