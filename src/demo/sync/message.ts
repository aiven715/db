import { SyncMessage } from '@automerge/automerge'

export const CREATE_TYPE = 0x00
export const UPDATE_TYPE = 0x01

export const makeCreateMessage = (binary: Uint8Array) => {
  const newBuffer = new ArrayBuffer(1 + binary.byteLength)
  const newBytes = new Uint8Array(newBuffer)
  newBytes[0] = CREATE_TYPE
  newBytes.set(binary, 1)
  return newBytes.buffer
}

export const makeUpdateMessage = (id: string, syncMessage: SyncMessage) => {
  const binaryId = new TextEncoder().encode(id)
  const newBuffer = new ArrayBuffer(1 + 32 + syncMessage.byteLength)
  const newBytes = new Uint8Array(newBuffer)
  newBytes[0] = UPDATE_TYPE
  newBytes.set(binaryId, 1)
  newBytes.set(syncMessage, 1 + 32)
  return newBytes.buffer
}

export const parseMessage = (message: ArrayBuffer) => {
  const binary = new Uint8Array(message)
  const type = binary[0]
  const payload = binary.subarray(1)
  return { type, payload }
}

export const parseUpdatePayload = (payload: Uint8Array) => {
  const binaryId = payload.subarray(0, 32)
  const syncMessage = payload.subarray(32)
  const id = new TextDecoder().decode(binaryId)
  return { id, syncMessage }
}
