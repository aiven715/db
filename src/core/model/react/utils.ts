import { Entry } from '../../types'
import { Model } from '../index'

export const createModelProxy = <T extends Entry, U extends Model<T>>(
  model: U,
  fieldsState: T,
  observingKeys: {}
) => model
