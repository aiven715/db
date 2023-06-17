export type Socket = {
  send(buffer: ArrayBuffer): void
}

export interface Sync {
  start(): void
  stop(): void
  create(binary: Uint8Array, sockets?: Socket[]): void
  update(id: string, binary: Uint8Array, sockets?: Socket[]): void
}
