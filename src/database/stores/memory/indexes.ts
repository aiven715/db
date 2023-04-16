export class Indexes<T, K extends keyof T = keyof T> {
  private indexes: Map<K, Map<T[K], string[]>> = new Map();

  constructor(private indexKeys: K[]) {}

  public add(document: T, primaryKey: keyof T) {
    const identifier = document[primaryKey] as string;
    for (const key of this.indexKeys) {
      const value = document[key];
      const keys = this.getOrCreateIdentifiers(key, value);
      if (!keys.includes(identifier)) {
        keys.push(identifier);
      }
    }
  }

  public remove(identifier: string) {
    for (const key of this.indexKeys) {
      const index = this.indexes.get(key);
      if (!index) {
        continue;
      }
      for (const [, identifiers] of index.entries()) {
        const i = identifiers.indexOf(identifier);
        if (i >= 0) {
          identifiers.splice(i, 1);
        }
      }
    }
  }

  public identifiers(key: K, value: T[K]) {
    const index = this.indexes.get(key);
    if (!index) {
      throw new Error(`Index ${key.toString()} does not exist`);
    }
    const identifiers = index.get(value);
    if (!identifiers) {
      throw new Error(
        `Index ${key.toString()} has no value ${value} identifiers`
      );
    }
    return identifiers;
  }

  public has(key: K, value: T[K]) {
    const index = this.indexes.get(key);
    if (!index) {
      return false;
    }
    return index.has(value);
  }

  private getOrCreateIdentifiers(key: K, value: T[K]) {
    const index = this.getOrCreateIndex(key);
    const keys = index.get(value);
    if (!keys) {
      index.set(value, []);
    }
    return index.get(value)!;
  }

  private getOrCreateIndex(key: K) {
    const index = this.indexes.get(key);
    if (!index) {
      this.indexes.set(key, new Map());
    }
    return this.indexes.get(key)!;
  }
}
