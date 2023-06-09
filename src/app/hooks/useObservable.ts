import { useEffect, useState } from 'react'
import { Observable } from 'rxjs'

export const useObservable = <T>(
  createObservable: () => Observable<T>,
  deps: unknown[] = []
) => {
  const [state, setState] = useState<T | undefined>(undefined)

  useEffect(() => {
    const observable = createObservable()
    const subscription = observable.subscribe(setState)
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
