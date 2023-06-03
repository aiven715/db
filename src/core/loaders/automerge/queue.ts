import PQueue from 'p-queue'

const DEFAULT_OPTIONS: SchedulerOptions = {
  debounceInterval: 50,
}

export type SchedulerOptions = {
  debounceInterval?: number
}

export class Queue {
  private readonly queue = new PQueue({ concurrency: 1 })
  private readonly debounceInterval: number
  private timer?: ReturnType<typeof setTimeout>

  constructor(options: SchedulerOptions = {}) {
    const { debounceInterval } = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as SchedulerOptions
    this.debounceInterval = debounceInterval!
  }

  add<T>(fn: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        return this.queue.add(() => fn()).then((v) => resolve(v!), reject)
      }, this.debounceInterval)
    })
  }
}
