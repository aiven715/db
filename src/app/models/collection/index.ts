import { Model } from '~/core/model'
import { register } from '~/core/model/registry'
import { Migration } from '~/core/types'

import { CollectionEntry, defaults, schema } from './schema'

@register
export class Collection extends Model<CollectionEntry> {
  static readonly collectionName = 'collections'
  static readonly schema = schema
  static readonly defaults = defaults
  static readonly migrations = new Array(5).fill(null! as Migration)

  setName(name: string) {
    this.fields.name = name
  }
}
