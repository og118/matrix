import { db } from '@/database/db'
import type { TrackedActivity } from '@/database/TrackedActivityTable'
import { defineStore } from 'pinia'
import { computed, ref, readonly } from 'vue'

export const useActivityStore = defineStore('activity', () => {
  const activities = ref<TrackedActivity[]>([])

  const activitiesCount = computed(() => activities.value.length)

  // Load activities from the database
  const loadActivities = async () => {
    try {
      const allActivities = await db.trackedActivities.getAll()
      activities.value = allActivities
      console.log('Loaded activities:', allActivities.length)
    } catch (error) {
      console.error('Failed to load activities:', error)
    }
  }

  // Add a new activity
  const addActivity = async (activity: Omit<TrackedActivity, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newActivity = await db.trackedActivities.create(activity)
      // Add to the beginning of the array for better UX (newest first)
      activities.value.unshift(newActivity)
      return newActivity
    } catch (error) {
      console.error('Failed to add activity:', error)
      throw error
    }
  }

  // Update an existing activity
  const updateActivity = async (id: number, changes: Partial<TrackedActivity>) => {
    try {
      const updatedActivity = await db.trackedActivities.update(id, changes)
      const index = activities.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        // Replace the entire object to ensure reactivity
        activities.value[index] = updatedActivity
      }
      return updatedActivity
    } catch (error) {
      console.error('Failed to update activity:', error)
      throw error
    }
  }

  // Delete an activity
  const deleteActivity = async (id: number) => {
    try {
      await db.trackedActivities.delete(id)
      // Filter out the deleted activity to trigger reactivity
      const originalLength = activities.value.length
      activities.value = activities.value.filter((a) => a.id !== id)
      console.log(
        `Deleted activity ${id}. Activities count: ${originalLength} -> ${activities.value.length}`,
      )
    } catch (error) {
      console.error('Failed to delete activity:', error)
      throw error
    }
  }

  return {
    activities: readonly(activities),

    activitiesCount: readonly(activitiesCount),

    loadActivities,
    addActivity,
    updateActivity,
    deleteActivity,
  }
})
