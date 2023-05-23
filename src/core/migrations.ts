import { getVersion, setVersion } from '~/core/meta'

import { CollectionConfig, Entry, Store } from './types'

export type Migration = (value: Entry) => Entry

export const migrate = async (
  collection: string,
  config: CollectionConfig,
  store: Store
) => {
  const migrations = config.migrations || []
  const currentVersion = await getVersion(store)
  const latestVersion = migrations.length

  if (currentVersion === latestVersion) {
    return
  }

  const migrationsToRun = migrations.slice(currentVersion)
  // TODO: rollback if migration fails (rely on a store transaction?)
  await runMigrations(collection, config, store, migrationsToRun)
  await setVersion(store, latestVersion)
}

const runMigrations = async (
  collection: string,
  config: CollectionConfig,
  store: Store,
  migrations: Migration[]
) => {
  const entries = await store.list(collection)
  return Promise.all(
    entries.map((entry) => {
      const nextEntry = applyMigrationsToEntry(entry, migrations)
      const identifier = nextEntry[config.primaryKey] as string
      return store.update(collection, identifier, nextEntry)
    })
  )
}

const applyMigrationsToEntry = (entry: Entry, migrations: Migration[]) => {
  return migrations.reduce((entry, migration) => migration(entry), entry)
}
