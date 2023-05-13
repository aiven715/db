export class InternalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InternalError'
  }
}

export class NotFoundError extends Error {
  constructor(identifier: unknown) {
    super(`Document with primary key "${identifier}" not found`)
    this.name = 'NotFoundError'
  }
}
