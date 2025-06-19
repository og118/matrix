<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { FormItem, FormField } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'vue-sonner'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
// import { WordTyper } from '@/components/ui/typer'
import { useForm } from 'vee-validate'
import { ref, onMounted } from 'vue'
import { dbUtils, type TrackedActivity } from '@/db'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Trash2 } from 'lucide-vue-next'

const formSchema = toTypedSchema(
  z.object({
    activity: z.string().min(2).max(50),
    mediaType: z.enum(['movie', 'book', 'tv-show']).default('movie'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

const activities = ref<TrackedActivity[]>([])

// Load activities from database
const loadActivities = async () => {
  try {
    activities.value = await dbUtils.getAllActivities()
  } catch (error) {
    console.error('Failed to load activities:', error)
    toast('Could not load activities')
  }
}

const handleCreateActivity = form.handleSubmit(async () => {
  // Get the current form values
  const newActivity = form.values.activity

  if (!newActivity) {
    toast('Please enter a book or movie title')
    return
  }

  try {
    // Create a new activity in the database
    await dbUtils.createActivity({
      mediaType: form.values.mediaType || 'movie', // Use selected media type
      mediaId: `search_${Date.now()}`, // Temporary ID based on timestamp
      status: 'planning',
      description: form.values.activity,
      isFavorite: false,
    })

    // Reload activities to show the new one
    await loadActivities()

    // Display a toast with success message
    toast('Activity Created')

    console.log('Activity created:', newActivity)
  } catch (error) {
    console.error('Failed to create activity:', error)
    toast('Failed to create activity')
  }
})

const handleDeleteActivity = async (activityId?: number) => {
  try {
    // Delete the activity from the database
    if (!activityId) {
      toast('Activity ID is required for deletion')
      return
    }

    await dbUtils.deleteActivity(activityId)

    // Reload activities to reflect the deletion
    await loadActivities()

    // Display a toast with success message
    toast('Activity Deleted')
  } catch (error) {
    console.error('Failed to delete activity:', error)
    toast('Failed to delete activity')
  }
}

// Load activities when component mounts
onMounted(() => {
  loadActivities()
})
</script>

<template>
  <div class="flex flex-col space-y-12 h-full gap-4">
    <form @submit="handleCreateActivity">
      <Card class="w-[700px]">
        <CardHeader>
          <CardTitle>
            What did you watch or read today?
            <!-- <WordTyper :display-text-array="[' read today?', ' watch today?']" cursor-color="#000000" /> -->
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div class="flex gap-2">
            <div class="flex-1">
              <FormField name="activity" v-slot="{ field }">
                <FormItem>
                  <Input v-bind="field" placeholder="Enter the title..." />
                </FormItem>
              </FormField>
            </div>
            <div>
              <FormField name="mediaType" v-slot="{ field, value, handleChange }">
                <FormItem>
                  <Select
                    :model-value="value"
                    @update:model-value="handleChange"
                    :defaultValue="field.value"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Movie</SelectItem>
                      <SelectItem value="tv-show">TV Show</SelectItem>
                      <SelectItem value="book">Book</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              </FormField>
            </div>
          </div>
          <!-- Display the current query value if available -->
        </CardContent>

        <CardFooter class="flex justify-between px-6">
          <Button class="w-[250px]" type="submit">Submit</Button>
          <Button variant="outline" class="w-[250px]" type="button"> Cancel </Button>
        </CardFooter>
      </Card>
    </form>

    <!-- Activities List -->
    <Card class="w-[700px]">
      <CardHeader>
        <CardTitle>Your Activities ({{ activities.length }})</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="activities.length === 0" class="text-center py-8 text-muted-foreground">
          No activities yet. Add your first movie or book above!
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="activity in activities"
            :key="activity.id"
            class="flex items-center justify-between p-3 border rounded-lg"
          >
            <div class="flex-1">
              <div class="font-medium">{{ activity.description || activity.mediaId }}</div>
              <div class="text-sm text-muted-foreground flex gap-4">
                <span class="capitalize">{{ activity.mediaType }}</span>
                <span class="capitalize">{{ activity.status.replace('_', ' ') }}</span>
                <span>{{ new Date(activity.createdAt).toLocaleDateString() }}</span>
              </div>
            </div>
            <Button type="button" variant="outline" @click="handleDeleteActivity(activity.id)">
              <Trash2 color="black" />
            </Button>
            <div class="flex items-center gap-2">
              <span v-if="activity.isFavorite" class="text-yellow-500">⭐</span>
              <span v-if="activity.rating" class="text-sm">{{ activity.rating }}/10</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
