import { identity } from 'lodash'

import { Model } from '~/core/model'
import { register } from '~/core/model/registry'

import { ProfileEntry, Theme, defaults, schema } from './schema'

@register
export class Profile extends Model<ProfileEntry> {
  static override readonly collectionName = 'profiles'
  static override readonly schema = schema
  static override readonly defaults = defaults
  static override readonly migrations = new Array(4).fill(identity)

  setTheme(theme: Theme) {
    this.fields.appTheme = theme
  }

  setFollowRedirects(followRedirects: boolean) {
    this.fields.appFollowRedirects = followRedirects
  }

  setSllVerification(verifySsl: boolean) {
    this.fields.appSslVerify = verifySsl
  }
}
