class _Box<T> implements Box<T> {
  private readonly value: T | Promise<T>;

  constructor(value: T | Promise<T>) {
    this.value = value;
  }

  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | Promise<R1>) | undefined | null,
    onRejected?: ((reason: any) => R2 | Promise<R2>) | undefined | null
  ): Box<R1 | R2> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.then(onFulfilled, onRejected));
    }
    const value = this.value;
    return new _Box(onFulfilled?.(value) || (value as unknown as R1));
  }

  catch<R = never>(
    onRejected?: ((reason: any) => R | Promise<R>) | undefined | null
  ): Box<T | R> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.catch(onRejected));
    }
    throw new Error("Cannot catch on a non-promise value");
  }

  finally(onFinally?: (() => void) | undefined | null): Box<T> {
    if (this.value instanceof Promise) {
      return new _Box(this.value.finally(onFinally));
    }
    onFinally?.();
    return new _Box(this.value);
  }

  get [Symbol.toStringTag]() {
    return "Box";
  }
}

export interface Box<T> {
  then<R1 = T, R2 = never>(
    onFulfilled?: ((value: T) => R1 | Promise<R1>) | undefined | null,
    onRejected?: ((reason: any) => R2 | Promise<R2>) | undefined | null
  ): Box<R1 | R2>;
  catch<R = never>(
    onRejected?: ((reason: any) => R | Promise<R>) | undefined | null
  ): Box<T | R>;
  finally(onFinally?: (() => void) | undefined | null): Box<T>;
  [Symbol.toStringTag]: string;
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
export const Box = _Box as {
  new <T>(value: T | Promise<T>): Box<T>;
};
