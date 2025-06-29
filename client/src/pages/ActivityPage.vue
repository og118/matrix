<script setup lang="ts">
import { useActivityStore } from '@/store/activityStore'
import { onMounted, watchEffect } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

const activityStore = useActivityStore()
const { activities } = storeToRefs(activityStore)

onMounted(() => {
  activityStore.loadActivities()
})

// Debug: Watch activities changes
watchEffect(() => {
  console.log('Component sees activities count:', activities.value.length)
})

const handleDeleteActivity = async (id?: number) => {
  if (!id) {
    console.error('No activity ID provided for deletion.')
    return
  }
  try {
    console.log('Before delete - activities count:', activities.value.length)
    await activityStore.deleteActivity(id)
    console.log('After delete - activities count:', activities.value.length)
  } catch (error) {
    console.error('Failed to delete activity:', error)
  }
}
</script>

<template>
  <!-- Activities List -->
  <Card>
    <CardHeader>
      <CardTitle>Your Activities ({{ activities.length }})</CardTitle>
    </CardHeader>
    <CardContent>
      <div v-if="activities.length === 0" class="text-center py-8 text-muted-foreground">
        No activities yet.
        <router-link to="/track" class="text-primary hover:underline font-medium">
          Log your first movie or book here!
        </router-link>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="flex items-center justify-between p-3 border rounded-lg"
        >
          <div class="flex-1">
            <div class="font-medium">
              {{ activity.description || activity.mediaId }}
            </div>
            <div class="text-sm text-muted-foreground flex flex-wrap gap-2 sm:gap-4">
              <span
                class="capitalize px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {{ activity.mediaType === 'tv-show' ? 'TV Show' : activity.mediaType }}
              </span>
              <span class="capitalize">{{ activity.status.replace('_', ' ') }}</span>
              <span>{{ new Date(activity.createdAt).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <span v-if="activity.isFavorite" class="text-yellow-500">⭐</span>
            <span v-if="activity.rating" class="text-sm">{{ activity.rating }}/10</span>
          </div>

          <Button
            type="button"
            variant="outline"
            class="ml-2"
            @click="handleDeleteActivity(activity.id)"
          >
            <Trash2 class="text-foreground" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
