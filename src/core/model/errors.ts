export class DatabaseNotFoundError extends Error {
  constructor() {
    super(`Database not found`)
  }
}

export class NotFoundError extends Error {
  constructor(collection: string, fields: Record<string, unknown> = {}) {
    super(
      `Document not found. Collection: ${collection}, fields: ${JSON.stringify(
        fields
      )}`
    )
    this.name = 'NotFoundError'
  }
}
