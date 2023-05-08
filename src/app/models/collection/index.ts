import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { CollectionEntry, schema } from './schema'

@register
export class Collection extends Model<CollectionEntry> {
  static collectionName = 'collections'
  static schema = schema

  setName(name: string) {
    this.fields.name = name
  }
}
