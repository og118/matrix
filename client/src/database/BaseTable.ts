import type { Table } from 'dexie'

export interface BaseEntity {
  id?: number
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

export interface ITableOperations<T extends BaseEntity> {
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  getById(id: number): Promise<T | undefined>
  getAll(): Promise<T[]>
  update(id: number, changes: Partial<T>): Promise<T>
  delete(id: number): Promise<void>
  clear(): Promise<void>
  bulkAdd(items: T[]): Promise<number[]>
}

export abstract class BaseTable<T extends BaseEntity> implements ITableOperations<T> {
  protected table: Table<T>

  constructor(table: Table<T>) {
    this.table = table
    this.setupHooks()
  }

  static getSchemaFields(): string {
    throw new Error('getSchemaFields must be implemented by subclass')
  }

  private setupHooks(): void {
    this.table.hook('creating', (_primKey, obj, _trans) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.table.hook('updating', (modifications, _primKey, _obj, _trans) => {
      ;(modifications as any).updatedAt = new Date()
    })
  }

  // Abstract methods that MUST be implemented by subclasses
  abstract create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>
  abstract getById(id: number): Promise<T | undefined>
  abstract getAll(): Promise<T[]>
  abstract update(id: number, changes: Partial<T>): Promise<T>
  abstract delete(id: number): Promise<void>
  abstract clear(): Promise<void>
  abstract bulkAdd(items: T[]): Promise<number[]>
}
