import { identity } from 'lodash'

import { generateUUIDFromSeed } from '~/app/utils/uuid'
import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { SHOW_FEEDBACK_PROMPT_AFTER } from './constants'
import { ApplicationEntry, defaults, schema } from './schema'

@register
export class Application extends Model<ApplicationEntry> {
  static override readonly collectionName = 'applications'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(2).fill(identity)

  get usePointerCursors() {
    return this.fields.usePointerCursors
  }

  get isFeedbackPromptVisible() {
    return (
      !this.fields.feedbackPromptDismissed &&
      this.fields.requestCount >= SHOW_FEEDBACK_PROMPT_AFTER
    )
  }

  get isImportBannerVisible() {
    return !this.fields.importBannerDismissed
  }

  get lastSeenPromo() {
    return this.fields.lastSeenPromo
  }

  setPointerCursors(value: boolean) {
    this.fields.usePointerCursors = value
  }

  incrementRequestCount() {
    this.fields.requestCount++
  }

  dismissFeedbackPrompt() {
    this.fields.feedbackPromptDismissed = true
  }

  dismissImportBanner() {
    this.fields.importBannerDismissed = true
  }

  setLastSeenPromo(version: string) {
    this.fields.lastSeenPromo = version
  }

  override save() {
    if (!this.fields.id) {
      this.fields.id = generateUUIDFromSeed('application')
    }
    return super.save()
  }
}
