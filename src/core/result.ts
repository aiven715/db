import { Observable, combineLatest, firstValueFrom, of } from 'rxjs'
import { catchError, switchMap } from 'rxjs/operators'

export class Result<T> {
  constructor(private observable: Observable<T>) {}

  map<U>(fn: (value: T) => U | Result<U>): Result<U> {
    return new Result(
      this.observable.pipe(
        switchMap((value) => {
          const result = fn(value)
          if (result instanceof Result) {
            return result.observable
          }
          return of(result)
        })
      )
    )
  }

  switchMap<U>(fn: (value: T) => Result<U>): Result<U> {
    return new Result(
      this.observable.pipe(switchMap((value) => fn(value).observable))
    )
  }

  catch<U>(fn: (error: unknown) => U | Result<U>): Result<T | U> {
    return new Result(
      this.observable.pipe(
        catchError((error) => {
          const result = fn(error)
          if (result instanceof Result) {
            return result.observable
          }
          return of(result)
        })
      )
    )
  }

  asValue() {
    let value = undefined as T
    this.observable.subscribe((v) => (value = v)).unsubscribe()
    return value
  }

  asPromise() {
    return firstValueFrom(this.observable)
  }

  asObservable() {
    return this.observable
  }

  static combineLatest<T>(items: Result<T>[]): Result<T[]> {
    if (!items.length) {
      return new Result(of([]))
    }
    return new Result(combineLatest(items.map((item) => item.observable)))
  }
}
