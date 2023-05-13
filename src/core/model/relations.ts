import { of } from 'rxjs'
import * as z from 'zod'

import { Result } from '~/core/result'
import { Entry } from '~/core/types'
import { Clean, Singular } from '~/library/types'
import { singular } from '~/library/utils'

import { Model } from './index'

export function relation<M extends typeof Model<Entry>>(
  Model: M
): {
  Model: M
  type: 'belongsTo'
  foreignKey: `${Singular<M['collectionName']>}Id`
}
export function relation<
  M extends typeof Model<Entry>,
  T extends Relation['type']
>(
  Model: M,
  type: T
): {
  Model: M
  type: T
  foreignKey: `${Singular<M['collectionName']>}Id`
}
export function relation<
  M extends typeof Model<Entry>,
  T extends Relation['type'],
  F extends Relation['foreignKey']
>(
  Model: M,
  type: T,
  foreignKey: F
): {
  Model: M
  type: T
  foreignKey: F
}
export function relation(
  M: typeof Model<Entry>,
  type?: Relation['type'],
  foreignKey?: string
) {
  const effectiveType = type || 'belongsTo'
  const effectiveForeignKey = foreignKey || `${singular(M.collectionName)}Id`
  return {
    Model: M,
    type: effectiveType,
    foreignKey: effectiveForeignKey,
  }
}

export const getRelations = <
  M extends typeof Model<Entry>,
  I extends Include<M>
>(
  ParentModel: M,
  fields: InstanceType<M>['fields'],
  include: I = {} as I
): Result<RelationInstances<M, I>> => {
  const items = Object.entries(include)
    .filter(([, value]) => value)
    .map(([key]) => {
      const relation = ParentModel.relations[key]
      if (!relation) {
        throw new Error(`Relation "${key}" not found`)
      }
      const { Model, foreignKey } = relation
      const id = fields[foreignKey] as string
      if (id === null) {
        return new Result(of([key, null! as Model<Entry> | null]))
      }
      const nestedInclude = typeof include[key] === 'object' ? include[key] : {}
      return Model.get(id, nestedInclude).map((instance) => [key, instance])
    })
  return Result.combineLatest(items).map(Object.fromEntries)
}

export type Relation = {
  Model: typeof Model<Entry>
  type: 'belongsTo'
  foreignKey: string
}

export type Include<M extends typeof Model<Entry>> = {
  [K in keyof M['relations']]?: boolean | Include<M['relations'][K]['Model']>
}

export type RelationInstances<
  M extends typeof Model<Entry>,
  I extends Include<M>
> = Clean<{
  [K in keyof I]: K extends keyof M['relations']
    ? I[K] extends true
      ? RelationInstance<M, K>
      : I[K] extends Include<M['relations'][K]['Model']>
      ? RelationInstances<M['relations'][K]['Model'], I[K]>
      : never
    : never
}>

export type RelationInstance<
  M extends typeof Model<Entry>,
  K extends keyof M['relations']
> = z.infer<M['schema']>[M['relations'][K]['foreignKey']] extends string
  ? InstanceType<M['relations'][K]['Model']>
  : InstanceType<M['relations'][K]['Model']> | null
