import { createProxy, isChanged, markToTrack } from 'proxy-compare'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'

import { Result } from '~/core/result'
import { Entry } from '~/core/types'

import { Model } from '../../index'

/**
 * ## Requirements
 * 1. Sync / Async
 * 2. Standalone / With relations
 */

/**
 * ## Questions
 * 1. How to avoid extra "useEffect" when calling "model.setSomething", using "model" as a dependency
 *  and "model.fields" in a render function?
 *  - useModelEffect
 */

/**
 * 1. Make sure we're not making props "affected" when they're accessed in the
 * callback.
 * 2. Make sure nothing missed from "useSnapshot" Valtio implementation.
 * 3. Make sure the following scenario works (write a unit test):
 *    - Using async store api. (async API most likely will return entirely new object on each update)
 *    - Using "useEffect" with "model.fields.objectProp" as a dependency.
 *    - Using "model.fields.stringProp" in a render function.
 *    - When changing "stringProp", "useEffect" should not be triggered.
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
          // TODO: compute nextValue based on current value + affected fields from the nextValue
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const proxyCache = useMemo(() => new WeakMap(), deps)
  return createProxy(snapshot, affected, proxyCache)
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
