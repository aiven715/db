export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

export type AnyRecord = Record<string, any>;
