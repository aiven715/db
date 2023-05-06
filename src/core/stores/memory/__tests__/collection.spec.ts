import { MemoryStoreCollection } from '../collection'

type Person = {
  id: string
  name: string
  age: number
}

const createStoreCollection = () => {
  return new MemoryStoreCollection<Person>({
    version: 1,
    primaryKey: 'id',
    indexes: ['age'],
  })
}

describe('InMemoryStore', () => {
  it('should be able to create a new store', () => {
    const store = createStoreCollection()
    expect(store).toBeDefined()
  })

  it('should be able to add a new document', () => {
    const store = createStoreCollection()
    const document = { id: '1', name: 'John', age: 30 }
    store.create(document)
    expect(store.list()).toEqual([document])
  })

  it('should be able to add multiple documents', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    store.create(document1)
    store.create(document2)
    expect(store.list()).toEqual([document1, document2])
  })

  it('should be able to filter by primary key', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    store.create(document1)
    store.create(document2)
    expect(store.list({ filter: { id: '1' } })).toEqual([document1])
  })

  it('should be able to filter by non-primary key', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    store.create(document1)
    store.create(document2)
    expect(store.list({ filter: { age: 20 } })).toEqual([document2])
  })

  it('should be able to filter by non-primary key with limit', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    expect(store.list({ filter: { age: 20 }, limit: 1 })).toEqual([document2])
  })

  it('should be able to filter by non-primary key with limit and offset', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    const document4 = { id: '4', name: 'Jill', age: 20 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    store.create(document4)
    expect(store.list({ filter: { age: 20 }, limit: 1, offset: 1 })).toEqual([
      document4,
    ])
  })

  it('should be able to filter by non-primary key with limit, offset and sort', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    const document4 = { id: '4', name: 'Jill', age: 20 }
    const document5 = { id: '5', name: 'Jenny', age: 20 }
    const document6 = { id: '6', name: 'Jen', age: 20 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    store.create(document4)
    store.create(document5)
    store.create(document6)
    expect(
      store.list({
        filter: { age: 20 },
        limit: 4,
        offset: 1,
        sort: { key: 'id', direction: 'desc' },
      })
    ).toEqual([document5, document4, document2])
  })

  it('should be able to sort by non-primary key', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    expect(store.list({ sort: { key: 'age', direction: 'desc' } })).toEqual([
      document3,
      document1,
      document2,
    ])
  })

  it('should be able to sort by non-primary key with limit', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    expect(
      store.list({ sort: { key: 'age', direction: 'asc' }, limit: 2 })
    ).toEqual([document2, document1])
  })

  it('should be able to sort by non-primary key with limit and offset', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    const document4 = { id: '4', name: 'Jill', age: 20 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    store.create(document4)
    expect(
      store.list({
        sort: { key: 'age', direction: 'asc' },
        limit: 2,
        offset: 2,
      })
    ).toEqual([document1, document3])
  })

  it('should be able to limit the number of documents returned', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    expect(store.list({ limit: 2 })).toEqual([document1, document2])
  })

  it('should be able to offset the number of documents returned', () => {
    const store = createStoreCollection()
    const document1 = { id: '1', name: 'John', age: 30 }
    const document2 = { id: '2', name: 'Jane', age: 20 }
    const document3 = { id: '3', name: 'Jack', age: 40 }
    store.create(document1)
    store.create(document2)
    store.create(document3)
    expect(store.list({ offset: 2 })).toEqual([document3])
  })
})
