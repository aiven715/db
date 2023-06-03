import { identity } from 'lodash'

import { Collection } from '~/app/models/collection'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'
import { relation } from '~/core/model/relations'

import { RequestSpecEntry, defaults, schema } from './schema'

@register
export class RequestSpec extends Model<RequestSpecEntry> {
  static override readonly collectionName = 'requestspecs'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(16).fill(identity)
  static override readonly relations = {
    collection: relation(Collection),
  }

  get displayName() {
    return this.fields.name || this.fields.url || 'untitled'
  }

  override save() {
    this.fields.clientUpdatedAt = Date.now()
    this.fields.workspaceId = ''
    return super.save()
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
