import { v5 } from 'uuid'

const UUID_NULL = '00000000-0000-0000-0000-000000000000'
const UUID_V5_NAMESPACE = UUID_NULL

export const getShortUUID = (uuid: string) => uuid.replace(/-/g, '')

export const generateUUIDFromSeed = (...seed: string[]) =>
  getShortUUID(v5(seed.join(':'), UUID_V5_NAMESPACE))
export type UUID = string
