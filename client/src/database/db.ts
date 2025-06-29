import Dexie from 'dexie'
import { TrackedActivityTable } from './TrackedActivityTable'

export class AppDatabase extends Dexie {
  // Public table classes
  public trackedActivities: TrackedActivityTable

  constructor() {
    super('ActivityTrackerDB')

    this.version(3).stores({
      tracked_activities: TrackedActivityTable.getSchemaFields(),
    })

    this.trackedActivities = new TrackedActivityTable(this.table('tracked_activities'))
  }
}

// Create and export the database instance
export const db = new AppDatabase()

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
