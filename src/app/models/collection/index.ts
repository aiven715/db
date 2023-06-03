import { identity } from 'lodash'

import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { CollectionEntry, defaults, schema } from './schema'

@register
export class Collection extends Model<CollectionEntry> {
  static override readonly collectionName = 'collections'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(6).fill(identity)

  setName(name: string) {
    this.fields.name = name
  }

  override save() {
    this.fields.workspaceId = ''
    return super.save()
  }
}
