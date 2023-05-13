import { Collection } from '~/app/models/collection'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'
import { relation } from '~/core/model/relations'

import { RequestSpecEntry, schema } from './schema'

@register
export class RequestSpec extends Model<RequestSpecEntry> {
  static readonly collectionName = 'requestspecs'
  static readonly schema = schema
  static readonly relations = {
    collection: relation(Collection),
  }

  setName(name: string) {
    this.fields.name = name
  }

  setUrl(url: string) {
    this.fields.url = url
  }

  setBody(body: string) {
    this.fields.body = body
  }
}
