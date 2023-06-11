import * as Automerge from '@automerge/automerge'
import { Change } from '@automerge/automerge'

import { Entry } from '~/core/types'

export const serialize = <T extends Entry>(value: T) => {
  const doc = Automerge.from(value)
  return Automerge.save(doc)
}

export const deserialize = <T extends Entry>(binary: Uint8Array) => {
  return Automerge.load<T>(binary) as T
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

export const getChanges = (binary1: Uint8Array, binary2: Uint8Array) => {
  return Automerge.getChanges(deserialize(binary1), deserialize(binary2))
}

// TODO: both changes can have their own changes
export const getChangesOfChanges = (changes1: Change[], changes2: Change[]) => {
  const smallest = changes1.length < changes2.length ? changes1 : changes2
  const largest = smallest === changes1 ? changes2 : changes1
  return largest.slice(smallest.length)
}

export const applyChanges = (binary: Uint8Array, changes: Change[]) => {
  const [doc] = Automerge.applyChanges(deserialize(binary), changes)
  return Automerge.save(doc)
}

export const getAllChanges = (binary: Uint8Array) => {
  const doc = deserialize(binary)
  return Automerge.getAllChanges(doc)
}

export const getChangeRootValue = (change: Change, key: string) => {
  const { ops } = Automerge.decodeChange(change)
  const op = ops.find(
    (op) => op.action === 'set' && op.key === key && op.obj === '_root'
  )
  if (!op) {
    throw new Error(`Could not find root value of key "${key}" in change`)
  }
  return op.value
}
