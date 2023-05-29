import type { RxCollection, RxDatabase } from 'rxdb'

export async function migrate(db: RxDatabase) {
  // Run leader election
  // (this is async operation but it shouldn't be awaited for non-leader tabs to work)
  db.waitForLeadership().then(() =>
    console.log('%c Leader tab elected', 'color: #DBDE52')
  )

  if (await hasMigrations(db.collections)) {
    // LokiJS adapter can not migrate data when there are multiple instances of rxdb (for instance multiple browser tabs are opeened)
    // https://github.com/pubkey/rxdb/issues/3749
    // That's why attempt to stop other instances and then migrate database
    await db.waitForLeadership()
    await runMigrations(db.collections)
  }
}

async function runMigrations(collections: Record<string, RxCollection>) {
  for (const collection of Object.values(collections)) {
    await migrateCollection(collection)
  }
}

async function hasMigrations(collections: Record<string, RxCollection>) {
  for (const collection of Object.values(collections)) {
    if (await collection.migrationNeeded()) {
      return true
    }
  }
  return false
}

async function migrateCollection(collection: RxCollection) {
  while (await collection.migrationNeeded()) {
    await collection.migratePromise(10)
  }
}
