import { useCallback, useState } from 'react'

export const usePersistedState = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    const storedValue = localStorage.getItem(key)
    return storedValue ? JSON.parse(storedValue) : defaultValue
  })

  const setValueAndStore = useCallback(
    (value: T) => {
      setValue(value)
      localStorage.setItem(key, JSON.stringify(value))
    },
    [key]
  )

  return [value, setValueAndStore] as const
}
