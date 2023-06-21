import { SyncMessage } from '@automerge/automerge'

// TODO: use CBOR?

export const createMessage = (id: string, syncMessage: SyncMessage | null) => {
  const binaryId = new TextEncoder().encode(id)
  const syncMessageSize = syncMessage?.byteLength || 0
  const newBuffer = new ArrayBuffer(32 + syncMessageSize)
  const newBytes = new Uint8Array(newBuffer)
  newBytes.set(binaryId, 0)
  if (syncMessage) {
    newBytes.set(syncMessage, 32)
  }
  return newBytes.buffer
}

export const parseMessage = (message: ArrayBuffer) => {
  const binary = new Uint8Array(message)
  const binaryId = binary.subarray(0, 32)
  const id = new TextDecoder().decode(binaryId)
  let syncMessage: SyncMessage | null = binary.subarray(32)
  if (syncMessage.byteLength === 0) {
    syncMessage = null
  }
  return { id, syncMessage }
}
