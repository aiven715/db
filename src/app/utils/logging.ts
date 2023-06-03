import { addBreadcrumb } from '@sentry/core'

export class Logger {
  constructor(private readonly name: string) {}

  public log(message: string) {
    const category = this.name
    console.log(category, message)
    addBreadcrumb({ category, message })
  }
}
