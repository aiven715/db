import { Migration } from '~/core/migrations'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { CollectionEntry, schema } from './schema'

@register
export class Collection extends Model<CollectionEntry> {
  static readonly collectionName = 'collections'
  static readonly schema = schema
  static readonly migrations = new Array(5).fill(null! as Migration)

  setName(name: string) {
    this.fields.name = name
  }
}
