import { RxCollectionCreator, RxDatabase, RxJsonSchema } from 'rxdb'
import { zodToJsonSchema } from 'zod-to-json-schema'

import { CollectionConfig, DatabaseOptions } from '../../types'

export async function createCollections(
  db: RxDatabase,
  options: DatabaseOptions
) {
  const collections: Record<string, RxCollectionCreator> = {}
  for (const name in options.collections) {
    const collection = options.collections[name]
    const schema = createJsonSchema(collection)
    collections[name] = { schema, autoMigrate: false }
  }
  await db.addCollections(collections)
}

function createJsonSchema({ schema, primaryKey }: CollectionConfig) {
  const jsonSchema = zodToJsonSchema(schema) as RxJsonSchema<any>
  // Delete $schema
  delete (jsonSchema as ReturnType<typeof zodToJsonSchema>).$schema
  // Set schema version
  jsonSchema.version = 0
  // Set primary key
  jsonSchema.primaryKey = primaryKey
  return jsonSchema
}
