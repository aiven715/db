import { DeepPartial } from '~/library/types'

export const createFieldsProxy = <T extends Record<string, any>>(
  fields: T,
  patch: DeepPartial<T>
) => {
  return new Proxy(fields, {
    set(target: T, p: string | symbol, value: any): boolean {
      patch[p as keyof T] = value
      return true
    },
    get(target: T, p: string | symbol): unknown {
      const fieldValue = target[p as keyof T]
      let patchValue = patch[p as keyof T]
      if (typeof fieldValue !== 'object' || fieldValue === null) {
        return patchValue || fieldValue
      }
      // TODO: test
      if (!patchValue) {
        patch[p as keyof T] = {}
        patchValue = patch[p as keyof T]
      }
      return createFieldsProxy(fieldValue, patchValue!)
    },
  })
}
