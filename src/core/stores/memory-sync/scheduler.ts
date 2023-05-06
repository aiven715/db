import Queue from 'p-queue'

import { Entry } from '../../types'

const DEFAULT_OPTIONS: SchedulerOptions<Entry> = {
  debounceInterval: 50,
  merge: (v) => v,
}

export type SchedulerOptions<T extends Entry> = {
  debounceInterval?: number
  merge?: (value: Partial<T>, previous?: Partial<T>) => Partial<T>
}

export class Scheduler<T extends Entry> {
  private readonly queue = new Queue({ concurrency: 1 })
  private readonly debounceInterval: number
  private readonly merge: (
    value: Partial<T>,
    previous?: Partial<T>
  ) => Partial<T>
  private timer?: ReturnType<typeof setTimeout>
  private value?: Partial<T>

  constructor(options: SchedulerOptions<T> = {}) {
    const { debounceInterval, merge } = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as SchedulerOptions<T>
    this.debounceInterval = debounceInterval!
    this.merge = merge!
  }

  add(fn: (value: Partial<T>) => Promise<void>, value: Partial<T>) {
    clearTimeout(this.timer)
    this.value = this.merge(value, this.value)
    this.timer = setTimeout(() => {
      // TODO: should we assign the value outside of setTimeout?
      const value = this.value
      delete this.value
      // TODO can it happen that the value is undefined (because we delete it in the line above)?
      return this.queue.add(() => fn(value!))
    }, this.debounceInterval)
  }
}
