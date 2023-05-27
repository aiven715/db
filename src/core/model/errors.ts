export class DatabaseNotFoundError extends Error {
  constructor() {
    super(`Database not found`)
  }
}
