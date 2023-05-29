import { identity } from 'lodash'

import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { CollectionEntry, defaults, schema } from './schema'

@register
export class Collection extends Model<CollectionEntry> {
  static readonly collectionName = 'collections'
  static readonly schema = schema
  static readonly defaults = defaults
  static readonly migrations = new Array(6).fill(identity)

  setName(name: string) {
    this.fields.name = name
  }
}
