import { RxCollectionCreator, RxDatabase, RxJsonSchema } from 'rxdb'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { CollectionConfig, DatabaseOptions, Migration } from '../../types'

export async function createCollections(
  db: RxDatabase,
  options: DatabaseOptions
) {
  const collections: Record<string, RxCollectionCreator> = {}
  for (const name in options.collections) {
    const collection = options.collections[name]
    const schema = createJsonSchema(collection)
    const migrationStrategies = createMigrationStrategies(collection)
    collections[name] = { schema, migrationStrategies, autoMigrate: false }
  }
  await db.addCollections(collections)
}

function createJsonSchema({
  migrations,
  schema,
  primaryKey,
}: CollectionConfig) {
  const jsonSchema = zodToJsonSchema(schema) as RxJsonSchema<any>
  // Delete $schema
  delete (jsonSchema as ReturnType<typeof zodToJsonSchema>).$schema
  // Set schema version
  jsonSchema.version = migrations?.length || 0
  // Set primary key
  jsonSchema.primaryKey = primaryKey
  return jsonSchema
}

function createMigrationStrategies({ migrations }: CollectionConfig) {
  if (!migrations || migrations.length === 0) {
    return
  }
  const migrationStrategies: Record<string, Migration> = {}
  for (const key in migrations) {
    const index = parseInt(key) + 1
    migrationStrategies[index] = migrations[key]
  }
  return migrationStrategies
}
