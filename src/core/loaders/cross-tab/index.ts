import { DatabaseOptions, Loader } from '../../types'

export const createLoader =
  (createBaseLoader: () => Loader) => async (options: DatabaseOptions) => {}
