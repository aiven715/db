export const singular = (str: string) => str.replace(/s$/, '')

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
