import { BaseTable, type BaseEntity } from './BaseTable'

export enum MediaType {
  Movie = 'movie',
  TVShow = 'tv-show',
  Book = 'book',
}

export enum ActivityStatus {
  Planning = 'planning',
  InProgress = 'in-progress',
  Completed = 'completed',
  Dropped = 'dropped',
  OnHold = 'on-hold',
}

export interface TrackedActivity extends BaseEntity {
  mediaType: MediaType
  mediaId: string
  status: ActivityStatus
  description?: string
  rating?: number
  startDate?: Date
  completedDate?: Date
  isFavorite: boolean
  posterPath?: string
  overview?: string
  year?: number
  progress?: number
  notes?: string
}

export class TrackedActivityTable extends BaseTable<TrackedActivity> {
  // Define the schema fields for this table
  static getSchemaFields(): string {
    return '++id, mediaType, mediaId, status, rating, startDate, completedDate, createdAt, updatedAt, isFavorite, posterPath, year, description, overview'
  }

  async create(
    data: Omit<TrackedActivity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TrackedActivity> {
    const activityData = {
      ...data,
      isFavorite: data.isFavorite ?? false,
      status: data.status || ('planning' as const),
    }

    return await this.table.add(activityData as TrackedActivity)
  }

  async getById(id: number): Promise<TrackedActivity | undefined> {
    const activity = await this.table.get(id)
    if (activity) {
      console.log(`Retrieved activity: ${activity.description}`)
    }
    return activity
  }

  async getAll(): Promise<TrackedActivity[]> {
    return await this.table.orderBy('updatedAt').reverse().toArray()
  }

  async update(id: number, changes: Partial<TrackedActivity>): Promise<TrackedActivity> {
    const updateData = { ...changes }

    if (updateData.rating !== undefined && (updateData.rating < 1 || updateData.rating > 10)) {
      throw new Error('Rating must be between 1 and 10')
    }

    await this.table.update(id, updateData)

    const updatedActivity = await this.table.get(id)
    if (!updatedActivity) {
      throw new Error('Activity not found after update')
    }

    return updatedActivity
  }

  async delete(id: number): Promise<void> {
    const activity = await this.table.get(id)
    if (activity) {
      console.log(`Deleting activity: ${activity.id}`)
      await this.table.delete(id)
    } else {
      throw new Error('Activity not found')
    }
  }

  async clear(): Promise<void> {
    await this.table.db.transaction('rw', [this.table], async () => {
      console.log('Clearing all tracked activities')
      await this.table.clear()
    })
  }

  async bulkAdd(items: TrackedActivity[]): Promise<number[]> {
    const processedItems = items.map((item) => ({
      ...item,
      isFavorite: item.isFavorite ?? false,
      status: item.status || ('planning' as const),
    }))

    return await this.table.bulkAdd(processedItems)
  }
}
