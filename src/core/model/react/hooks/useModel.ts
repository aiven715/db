import {
  affectedToPathList,
  createProxy,
  isChanged,
  markToTrack,
} from 'proxy-compare'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import { Result } from '~/core/result'
import { Entry } from '~/core/types'

import { Model } from '../../index'

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
  const [getValue, setValue] = useValue(() => retrieve().asValue(), deps)
  const lastAffected = useRef<WeakMap<object, unknown>>()

  const subscribe = useCallback((callback: VoidFunction) => {
    const subscription = retrieve()
      .asObservable()
      .subscribe((nextValue) => {
        console.log(affectedToPathList(getValue(), lastAffected.current!))
        if (isChanged(getValue(), nextValue, lastAffected.current!)) {
          setValue(nextValue)
          callback()
        }
      })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const affected = new WeakMap()
  useEffect(() => {
    lastAffected.current = affected
  })

  const snapshot = useSyncExternalStore(subscribe, getValue)
  // TODO: memo for reference equality
  return createProxy(snapshot, affected)
}

const useValue = <T extends Entry, U extends Model<T>>(
  init: () => U,
  deps: unknown[]
) => {
  const valueRef = useRef<U>()
  const setValue = useCallback((value: U) => {
    // TODO: should we call it multiple times? check internal implementation
    markToTrack(value, true)
    valueRef.current = value
  }, [])
  const getValue = useCallback(() => valueRef.current!, [])
  useEffect(() => {
    setValue(init())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  if (!valueRef.current) {
    setValue(init())
  }
  return [getValue, setValue] as const
}
