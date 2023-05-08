import { createContext, useContext, useState } from 'react'

import { Content } from './Content'
import { Sidebar } from './Sidebar'

export const Root = () => {
  const { state } = useAppState()
  return (
    <div className='flex items-start text-white font-mono'>
      <Sidebar />
      {state.selectedRequestSpecId && <Content />}
    </div>
  )
}

type State = {
  selectedRequestSpecId: string | null
}

export const StateContext = createContext<{
  state: State
  setState: (state: State) => void
} | null>(null)

export const StateProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<State>({ selectedRequestSpecId: null })
  return (
    <StateContext.Provider value={{ state, setState }}>
      {children}
    </StateContext.Provider>
  )
}

export const useAppState = () => {
  const state = useContext(StateContext)
  if (state === null) {
    throw new Error('useState must be used within a StateProvider')
  }
  return state
}
