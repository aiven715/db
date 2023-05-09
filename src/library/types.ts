export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}

export type AnyRecord = Record<string, any>

export type Clean<T extends AnyRecord> = {
  [K in keyof T as T[K] extends never | undefined ? never : K]: T[K]
}

export type Singular<T extends string> = T extends `${infer U}s` ? U : T
