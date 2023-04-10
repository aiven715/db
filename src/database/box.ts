export class Box<T> {
  constructor(private value: T | Promise<T>) {}

  then<U>(fn: (value: T) => U): Box<U> {
    if (this.value instanceof Promise) {
      return new Box(this.value.then(fn));
    }
    return new Box(fn(this.value));
  }

  catch<U>(fn: (error: Error) => U): Box<U> {
    if (this.value instanceof Promise) {
      return new Box(this.value.catch(fn) as Promise<U>);
    }
    throw new Error("Cannot catch on a non-promise value");
  }
}
