import { Collection } from '~/app/models/collection'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { RequestSpecEntry, schema } from './schema'

@register
export class RequestSpec extends Model<RequestSpecEntry> {
  static collectionName = 'requestspecs'
  static schema = schema
  static relations = {
    collection: {
      model: Collection,
      type: 'belongsTo', // or 'hasOne'
      foreignKey: 'collectionId',
    },
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
