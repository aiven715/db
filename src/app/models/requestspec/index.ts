import { Collection } from '~/app/models/collection'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'
import { relation } from '~/core/model/relations'

import { RequestSpecEntry, defaults, schema } from './schema'

@register
export class RequestSpec extends Model<RequestSpecEntry> {
  static readonly collectionName = 'requestspecs'
  static readonly schema = schema
  static readonly defaults = defaults
  // static readonly migrations = new Array(15).fill(null! as Migration)
  static readonly relations = {
    collection: relation(Collection),
  }

  get displayName() {
    return this.fields.name || this.fields.url || 'untitled'
  }

  setName(name: string) {
    this.fields.name = name
  }

  setUrl(url: string) {
    this.fields.url = url
  }

  setBody(value: string) {
    this.fields.body.text.value = value
  }
}
