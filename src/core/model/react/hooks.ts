import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import { distinctUntilChanged } from 'rxjs/operators'

import { Result } from '../../result'
import { Entry } from '../../types'
import { Model } from '../index'

/**
 * 1. Update component only when accessed properties change
 *  - including:
 *    - own fields (with relations, like collectionId)
 *    - fields of relations
 */
export const useModel = <T extends Entry, U extends Model<T>>(
  key: string,
  retrieve: () => Result<U>,
  deps: unknown[]
) => {
  const valueRef = useRef<U>()

  if (!valueRef.current) {
    valueRef.current = retrieve().asValue()
  }

  useEffect(() => {
    valueRef.current = retrieve().asValue()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const subscribe = useCallback((callback: VoidFunction) => {
    const subscription = retrieve()
      .asObservable()
      .subscribe((value) => {
        valueRef.current = value
        callback()
      })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const getSnapshot = useCallback(() => valueRef.current!, [])

  return useSyncExternalStore(subscribe, getSnapshot)
}

export const useIds = <T extends { id: string }>(
  key: string,
  retrieve: () => Result<T[]>,
  deps: unknown[]
) => {
  // TODO: probably should call retrieve() only once
  const result = retrieve()
  // FIXME: initialIds can be "undefined" if store is async
  const initialIds = result.asValue().map((item) => item.id)
  const [items, setItems] = useState<string[]>(initialIds)

  useEffect(() => {
    const subscription = result
      .asObservable()
      .pipe(
        distinctUntilChanged((prev, current) => prev.length === current.length)
      )
      .subscribe((items) => setItems(items.map((item) => item.id)))
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return items
}
