import { identity } from 'lodash'

import { generateUUIDFromSeed } from '~/app/utils/uuid'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { ApplicationWindowEntry, defaults, schema } from './schema'

@register
export class ApplicationWindow extends Model<ApplicationWindowEntry> {
  static override readonly collectionName = 'windows'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(2).fill(identity)

  override save() {
    if (!this.fields.id) {
      this.fields.id = generateUUIDFromSeed('application-window')
    }
    return super.save()
  }
}
