class _Box<T> implements Box<T> {
  private readonly value: T | Promise<T>

  constructor(value: T | Promise<T> = undefined as T) {
    this.value = value
  }

  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | Promise<R1>) | undefined | null,
    onRejected?: ((reason: any) => R2 | Promise<R2>) | undefined | null
  ): Box<R1 | R2> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.then(onFulfilled, onRejected))
    }
    const value = this.value
    return new _Box(onFulfilled?.(value) || (value as unknown as R1))
  }

  catch<R = never>(
    onRejected?: ((reason: any) => R | Promise<R>) | undefined | null
  ): Box<T | R> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.catch(onRejected))
    }
    throw new Error('Cannot catch on a non-promise value')
  }

  finally(onFinally?: (() => void) | undefined | null): Box<T> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.finally(onFinally))
    }
    onFinally?.()
    return new _Box(this.value)
  }

  get [Symbol.toStringTag]() {
    return 'Box'
  }

  static all<T>(boxes: Box<T>[]): Box<T[]> {
    const isSync = boxes.every(
      (box) => !((box as _Box<T>).value instanceof Promise)
    )
    if (isSync) {
      const values = boxes.map((box) => (box as _Box<T>).value) as T[]
      return new _Box(values)
    }
    return new _Box(Promise.all(boxes))
  }
}

export interface Box<T> {
  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | Promise<R1>) | undefined | null,
    onRejected?: ((reason: any) => R2 | Promise<R2>) | undefined | null
  ): Box<R1 | R2>
  catch<R = never>(
    onRejected?: ((reason: any) => R | Promise<R>) | undefined | null
  ): Box<T | R>
  finally(onFinally?: (() => void) | undefined | null): Box<T>
  [Symbol.toStringTag]: string
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Box = _Box as {
  new <T>(value: T | Promise<T>): Box<T>
  new (): Box<void>
  all<T>(boxes: Box<T>[]): Box<T[]>
}
