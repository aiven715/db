import { SyncMessage } from '@automerge/automerge'

// TODO: use CBOR?

export const createMessage = (id: string, syncMessage: SyncMessage) => {
  const binaryId = new TextEncoder().encode(id)
  const newBuffer = new ArrayBuffer(32 + syncMessage.byteLength)
  const newBytes = new Uint8Array(newBuffer)
  newBytes.set(binaryId, 0)
  newBytes.set(syncMessage, 32)
  return newBytes.buffer
}

export const parseMessage = (message: ArrayBuffer) => {
  const binary = new Uint8Array(message)
  const binaryId = binary.subarray(0, 32)
  const syncMessage = binary.subarray(32)
  const id = new TextDecoder().decode(binaryId)
  return { id, syncMessage }
}
