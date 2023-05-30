import { addRxPlugin, createRxDatabase } from 'rxdb'
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election'
import { getRxStorageLoki } from 'rxdb/plugins/lokijs'
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration'

import { DatabaseOptions } from '../../types'

import { createCollections } from './collections'
import { migrate } from './migrations'

const LokiIncrementalIndexedDBAdapter = require('lokijs/src/incremental-indexeddb-adapter')

const PLUGINS = [RxDBMigrationPlugin, RxDBLeaderElectionPlugin]

export const createRxDB = async (options: DatabaseOptions) => {
  PLUGINS.forEach(addRxPlugin)
  const adapter = new LokiIncrementalIndexedDBAdapter()

  const rxdb = await createRxDatabase({
    name: options.name,
    storage: getRxStorageLoki({ adapter }),
  })
  await createCollections(rxdb, options)
  await migrate(rxdb)

  return rxdb
}
