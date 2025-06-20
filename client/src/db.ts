import Dexie, { type Table } from 'dexie'

// Define your data models
export interface TrackedActivity {
  id?: number
  mediaType: 'movie' | 'book' | 'tv-show'
  mediaId: string // External API ID (e.g., IMDb ID, ISBN, etc.)
  status: 'planning' | 'in_progress' | 'completed' | 'dropped' | 'on_hold'
  progress?: number // Pages read for books, or percentage for movies
  totalPages?: number // For books
  currentPage?: number // For books
  rating?: number // User rating 1-10 or 1-5
  startDate?: Date
  completedDate?: Date
  notes?: string
  description?: string
  isFavorite: boolean
  // Additional metadata from search results
  posterPath?: string // URL to poster or cover image
  overview?: string // Description or summary
  year?: string // Release or publish year
  createdAt: Date
  updatedAt: Date
}

export class AppDatabase extends Dexie {
  tracked_activities!: Table<TrackedActivity>

  constructor() {
    super('ActivityTrackerDB')

    this.version(3).stores({
      tracked_activities:
        '++id, mediaType, mediaId, status, rating, startDate, completedDate, posterPath, year, createdAt, updatedAt',
    })

    // Add hooks for automatic timestamps
    this.tracked_activities.hook('creating', (_, obj, __) => {
      obj.createdAt = new Date()
      obj.updatedAt = new Date()
    })

    this.tracked_activities.hook(
      'updating',
      (modifications: Partial<TrackedActivity>, _, __, ___) => {
        modifications.updatedAt = new Date()
      },
    )
  }
}

// Create and export the database instance
export const db = new AppDatabase()

export const dbUtils = {
  // Tracked Activity operations
  async createActivity(activityData: Omit<TrackedActivity, 'id' | 'createdAt' | 'updatedAt'>) {
    return await db.tracked_activities.add(activityData as TrackedActivity)
  },

  async getActivityById(id: number) {
    return await db.tracked_activities.get(id)
  },

  async getAllActivities() {
    return await db.tracked_activities.orderBy('updatedAt').reverse().toArray()
  },

  async updateActivity(id: number, changes: Partial<TrackedActivity>) {
    return await db.tracked_activities.update(id, changes)
  },

  async deleteActivity(id: number) {
    return await db.tracked_activities.delete(id)
  },

  // Database operations
  async clearAllData() {
    await db.transaction('rw', [db.tracked_activities], async () => {
      await db.tracked_activities.clear()
    })
  },

  async exportData() {
    const activities = await db.tracked_activities.toArray()

    return {
      tracked_activities: activities,
      exportDate: new Date().toISOString(),
    }
  },

  async importData(data: { tracked_activities: TrackedActivity[] }) {
    await db.transaction('rw', [db.tracked_activities], async () => {
      await db.tracked_activities.clear()
      await db.tracked_activities.bulkAdd(data.tracked_activities)
    })
  },
}

// Initialize database on app start
export const initializeDatabase = async () => {
  try {
    await db.open()
    console.log('Database initialized successfully')

    return true
  } catch (error) {
    console.error('Failed to initialize database:', error)
    return false
  }
}
