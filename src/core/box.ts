// TODO: rename it to Future
class _Box<T> implements Box<T> {
  private readonly value: () => T

  constructor(value: () => T = () => undefined as T) {
    this.value = value
  }

  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | Box<R1>) | undefined | null,
    onRejected?: ((reason: any) => R2 | Box<R2>) | undefined | null
  ): Box<R1 | R2> {
    try {
      const value = this.value()
      const result = onFulfilled?.(value) as R1
      if (isPromiseLike(result)) {
        return result as unknown as Box<R1>
      }
      return new _Box(() => result || (value as unknown as R1))
    } catch (err) {
      if (!onRejected) {
        return new _Box(() => {
          throw err
        })
      }
      const result = onRejected(err)
      if (isPromiseLike(result)) {
        return result as Box<R2>
      }
      return new _Box(() => result as R2)
    }
  }

  catch<R = never>(
    onRejected?: ((reason: any) => R | Box<R>) | undefined | null
  ): Box<T | R> {
    return this.then(undefined, onRejected)
  }

  finally(onFinally?: (() => void) | undefined | null): Box<T> {
    onFinally?.()
    return new _Box(this.value)
  }

  get [Symbol.toStringTag]() {
    return 'Box'
  }

  static all<T>(boxes: Box<T>[]): Box<T[]> {
    const values = boxes.map((box) => (box as _Box<T>).value()) as T[]
    return new _Box(() => values)
  }
}

export interface Box<T> extends Promise<T> {}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Box = _Box as {
  new <T>(value: () => T): Box<T>
  new (): Box<void>
  all<T>(boxes: Box<T>[]): Box<T[]>
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  Boolean(value && typeof (value as PromiseLike<unknown>).then === 'function')
