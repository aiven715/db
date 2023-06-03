import * as Automerge from '@automerge/automerge'
import { Change } from '@automerge/automerge'

import { Entry } from '../../types'

export const serialize = <T extends Entry>(value: T) => {
  const doc = Automerge.from(value)
  return Automerge.save(doc)
}

export const deserialize = <T extends Entry>(binary: Uint8Array) => {
  return Automerge.load<T>(binary) as T
}

export const view = <T extends Entry>(binary: Uint8Array) => {
  return deserialize(binary)
}

export const compact = (binary: Uint8Array) => {
  return serialize(deserialize(binary))
}

export const update = <T extends Entry>(
  binary: Uint8Array,
  data: Partial<T>
) => {
  const doc = Automerge.load<T>(binary)
  const nextDoc = Automerge.change(doc, (props) => {
    Object.assign(props, data)
  })
  return Automerge.save(nextDoc)
}

export const getDiff = (binary1: Uint8Array, binary2: Uint8Array) => {
  return Automerge.getChanges(deserialize(binary1), deserialize(binary2))
}

export const applyChanges = (binary: Uint8Array, changes: Change[]) => {
  const [doc] = Automerge.applyChanges(deserialize(binary), changes)
  return Automerge.save(doc)
}
