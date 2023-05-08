import { createProxy, isChanged, markToTrack } from 'proxy-compare'
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react'

import { Result } from '~/core/result'
import { Entry } from '~/core/types'

import { Model } from '../../index'

/**
 * 1. Sync / Async
 * 2. Standalone / With relations
 * 3. Memo output
 */

/**
 * 1. Make sure we're not making props "affected" when they're accessed in the
 * callback.
 * 2. Make sure nothing missed from "useSnapshot" Valtio implementation.
 */
export const useModel = <T extends Entry, U extends Model<T>>(
  key: string,
  retrieve: () => Result<U>,
  deps: unknown[]
) => {
  const [getValue, setValue] = useValue(() => retrieve().asValue(), deps)
  const affectedRef = useRef<WeakMap<object, unknown>>()

  const subscribe = useCallback((callback: VoidFunction) => {
    const subscription = retrieve()
      .asObservable()
      .subscribe((nextValue) => {
        if (isChanged(getValue(), nextValue, affectedRef.current!)) {
          setValue(nextValue)
          callback()
        }
      })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  const affected = new WeakMap()
  useEffect(() => {
    affectedRef.current = affected
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
    markToTrack(value, true)
    valueRef.current = value
  }, [])
  const getValue = useCallback(() => valueRef.current!, [])
  useEffect(
    () => setValue(init()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  )
  if (!valueRef.current) {
    setValue(init())
  }
  return [getValue, setValue] as const
}
