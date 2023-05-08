import { useEffect, useMemo, useState } from 'react'
import { distinctUntilChanged, skip } from 'rxjs/operators'

import { Collection } from '~/core/collection'
import { createModelProxy } from '~/core/model/react/utils'

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
  const observingKeys = {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const model = useMemo(() => retrieve().asValue(), deps)
  const [fields, setFields] = useState(model.fields)
  const proxy = useMemo(
    () => createModelProxy(model, fields, observingKeys),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps
  )

  useEffect(() => {
    const collection = proxy['class']['collection'] as unknown as Collection<T>
    collection.get(proxy.id).asObservable().pipe(skip(1)).subscribe(setFields)
  }, [proxy])

  return proxy
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
