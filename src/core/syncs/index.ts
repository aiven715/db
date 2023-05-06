export interface Sync {
  commit(): void
  pull(): void
  push(): void
  // for auto-save
  // unstage(): void
  // rollback(): void
}
