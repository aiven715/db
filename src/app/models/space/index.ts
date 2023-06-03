import { identity } from 'lodash'

import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { Include } from '../../../core/model/relations'
import { Entry, Query } from '../../../core/types'
import { Icon } from '../common/icon'

import { SpaceEntry, defaults, schema } from './schema'

@register
export class Space extends Model<SpaceEntry> {
  static override readonly collectionName = 'spaces'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(4).fill(identity)

  setName(name: string) {
    this.fields.name = name
  }

  setIcon(icon: Icon) {
    this.fields.icon = icon
  }

  static override list<
    T extends Entry,
    M extends typeof Model<T>,
    I extends Include<M>
  >(this: M, query?: Query, include?: I) {
    // @ts-ignore
    return super.list<T, M, I>(
      { ...query, sort: { key: 'orderKey', direction: 'asc' } },
      include
    )
  }
}
