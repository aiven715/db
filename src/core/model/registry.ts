import { Entry } from '../types'

import { Model } from './index'

export const registry: (typeof Model<Entry>)[] = []

export const register = (Class: typeof Model<Entry>) => {
  registry.push(Class)
}
