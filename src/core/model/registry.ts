import { Entry } from '../types'

import { Model } from './index'

export const registry: (typeof Model<Entry>)[] = []

// TODO: accept database name, if not provided, assume we use only one database
//       (databaseName: string) => (Class: typeof Model<Entry>) => ...
export const register = (Class: typeof Model<Entry>) => {
  registry.push(Class)
}
