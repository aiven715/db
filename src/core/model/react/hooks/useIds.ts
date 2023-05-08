import { useEffect, useState } from 'react'
import { distinctUntilChanged } from 'rxjs/operators'

import { Result } from '~/core/result'

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
