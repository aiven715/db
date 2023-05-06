import { Entry, Query } from '~/core/types'

import { InternalError } from '../../errors'

export const filterByPrimaryKey = <T extends Entry>(
  query: Query<T>,
  documents: Map<string, T>,
  primaryKey: keyof T
) => {
  if (!query.filter || !query.filter[primaryKey]) {
    throw new InternalError(
      `Query filter must contain a value for primary key ${primaryKey.toString()}`
    )
  }
  const document = documents.get(query.filter[primaryKey] as string)
  const hasZeroLimit = query.limit === 0
  const hasOffset = typeof query.offset === 'number' && query.offset > 0
  if (!document || hasOffset || hasZeroLimit) {
    return []
  }
  return [document]
}

export const process = <T extends Entry, K extends keyof T>(
  query: Query<T>,
  documents: Map<string, T>,
  identifiers: string[]
) => {
  identifiers = [...identifiers]

  const results: T[] = []
  const filterKeys = (query?.filter ? Object.keys(query.filter) : []) as K[]
  const hasFilter = filterKeys.length > 0
  const hasSort = !!query.sort
  const filterAndSort = hasFilter && hasSort

  if (query.limit === 0) {
    return results
  }

  if (!filterAndSort) {
    sort(query, identifiers, (identifier) => documents.get(identifier)!)
    offset(query, identifiers)
    limit(query, identifiers)
  }

  for (const identifier of identifiers) {
    const document = documents.get(identifier)!
    const shouldPush = filterDocument(query, document, filterKeys)
    if (shouldPush) {
      results.push(document)
    }
  }

  if (filterAndSort) {
    sort(query, results)
    offset(query, results)
    limit(query, results)
  }

  return results
}

const sort = <T extends Entry, U>(
  query: Query<T>,
  items: U[],
  getDocument: (item: U) => T = (item) => item as unknown as T
) => {
  if (!query.sort) {
    return
  }
  const { key: sortKey, direction } = query.sort
  items.sort((a, b) => {
    const valueA = getDocument(a)[sortKey]
    const valueB = getDocument(b)[sortKey]
    if (valueA < valueB) {
      return direction === 'asc' ? -1 : 1
    }
    if (valueA > valueB) {
      return direction === 'asc' ? 1 : -1
    }
    return 0
  })
}

const offset = <T extends Entry>(query: Query<T>, items: unknown[]) => {
  if (!query.offset) {
    return
  }
  items.splice(0, query.offset)
}

const limit = <T extends Entry>(query: Query<T>, items: unknown[]) => {
  if (!query.limit) {
    return
  }
  if (items.length > query.limit) {
    items.length = query.limit
  }
}

const filterDocument = <T extends Entry, K extends keyof T>(
  query: Query<T>,
  document: T,
  filterKeys: K[]
) => {
  if (!query.filter) {
    return true
  }
  if (filterKeys.length === 1) {
    const key = filterKeys[0]
    const value = query.filter[key]!
    return document[key] === value
  }
  return filterKeys.every((key) => document[key] === query.filter![key])
}
