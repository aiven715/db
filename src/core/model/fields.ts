import { get, isObjectLike, set } from 'lodash'
import { AnyZodObject } from 'zod'

import { Entry } from '~/core/types'
import { DeepPartial } from '~/library/types'

export class FieldsResolver<T extends Entry> {
  readonly effective: T
  patch: DeepPartial<T> = {}

  constructor(public initial: T, schema: AnyZodObject) {
    this.effective = createEffectiveFields(this, schema, [])
  }

  set(initial: T) {
    this.initial = initial
    this.patch = {}
  }
}

const createEffectiveFields = <F extends FieldsResolver<T>, T extends Entry>(
  fields: F,
  schema: AnyZodObject,
  context: string[] = []
) => {
  return new Proxy(createSourceObject(schema), {
    set(target, key, value): boolean {
      const path = [...context, key]
      set(fields.patch, path, value)
      return true
    },
    get(target, key): unknown {
      const path = [...context, key as string]
      const initialValue = get(fields.initial, path)
      const patchValue = get(fields.patch, path)
      if (!isObjectLike(initialValue)) {
        return patchValue ?? initialValue
      }
      return createEffectiveFields(fields, schema.shape[key], path)
    },
  }) as T
}

// Setting enumerable keys from schema shape to make proxy object
// behave like a plain object (e.g. for JSON.stringify or clone)
const createSourceObject = (objSchema: AnyZodObject) => {
  const obj = {}
  for (const key in objSchema.shape) {
    Object.defineProperty(obj, key, { enumerable: true, writable: true })
  }
  return obj
}
