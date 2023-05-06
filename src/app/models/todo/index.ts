import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { TodoEntry, schema } from './schema'

@register
export class Todo extends Model<TodoEntry> {
  static collectionName = 'todos'
  static schema = schema
}
