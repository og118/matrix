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
import { ref, onMounted, watch } from 'vue'
import { dbUtils, type TrackedActivity } from '@/db'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { Trash2 } from 'lucide-vue-next'
import { search, type BookResult, type MovieResult } from '@/api/search'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

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
const searchResults = ref<(MovieResult | BookResult)[]>([])
const isSearching = ref(false)
const searchTimeout = ref<number | null>(null)

// Debounced search function
const debouncedSearch = (query: string, type: 'book' | 'movie' | 'tv-show') => {
  // Clear any existing timeout
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  // Don't search if query is too short
  if (!query || query.length < 2) {
    searchResults.value = []
    return
  }

  isSearching.value = true

  // Set a new timeout to perform the search
  searchTimeout.value = setTimeout(async () => {
    try {
      // Convert 'tv-show' to 'movie' for API compatibility if needed
      const apiType = type === 'tv-show' ? 'movie' : (type as 'book' | 'movie')
      const results = await search(query, apiType)
      searchResults.value = results
    } catch (error) {
      console.error('Search failed:', error)
      toast('Search failed. Please try again.')
    } finally {
      isSearching.value = false
    }
  }, 500) as unknown as number
}

// Extract year from date string
const extractYear = (dateString: string): string => {
  if (!dateString) return 'Unknown'
  // Handle both YYYY-MM-DD format and other possible date formats
  const match = dateString.match(/(\d{4})/)
  return match ? match[1] : 'Unknown'
}

// Watch for form value changes to trigger search
watch(
  () => form.values.activity,
  (newValue) => {
    if (newValue) {
      debouncedSearch(newValue, form.values.mediaType as 'book' | 'movie' | 'tv-show')
    } else {
      searchResults.value = []
    }
  },
  { immediate: false },
)

// Watch media type changes to re-search if we have an active query
watch(
  () => form.values.mediaType,
  (newValue) => {
    if (form.values.activity) {
      debouncedSearch(form.values.activity, newValue as 'book' | 'movie' | 'tv-show')
    }
  },
  { immediate: false },
)

// Handle selection from search results
const selectSearchResult = (result: any) => {
  // Set the form value to the selected title
  form.setFieldValue('activity', result.title || result.name)

  // Store the selected result data for form submission
  const selectedMediaItem = {
    id: result.id,
    title: result.title || result.name,
    posterPath: result.poster_path || result.image,
    overview: result.overview || result.description,
    // Add other fields you want to capture
  }

  // You can store this data in a ref for later use
  localStorage.setItem('selectedMediaItem', JSON.stringify(selectedMediaItem))

  // Clear the search results
  searchResults.value = []
}

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
    // Check if we have a selected media item from the search
    let selectedItem = null
    try {
      selectedItem = JSON.parse(localStorage.getItem('selectedMediaItem') || '')
    } catch (e) {
      // No selected item or invalid JSON
    }

    // Create a new activity in the database
    await dbUtils.createActivity({
      mediaType: form.values.mediaType || 'movie', // Use selected media type
      mediaId: selectedItem?.id || `search_${Date.now()}`, // Use API ID if available
      status: 'planning',
      description: form.values.activity,
      // Include additional metadata if available from search
      ...(selectedItem && {
        posterPath: selectedItem.posterPath,
        overview: selectedItem.overview,
      }),
      isFavorite: false,
    })

    // Clear the stored media item
    localStorage.removeItem('selectedMediaItem')

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

console.log(searchResults.value)

// Load activities when component mounts
onMounted(() => {
  loadActivities()
})
</script>

<template>
  <div class="flex flex-col space-y-12 h-full gap-4 w-full max-w-2xl mx-auto px-4">
    <form @submit="handleCreateActivity">
      <Card class="w-full">
        <CardHeader>
          <CardTitle>
            What did you watch or read today?
            <!-- <WordTyper :display-text-array="[' read today?', ' watch today?']" cursor-color="#000000" /> -->
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div class="flex flex-col sm:flex-row gap-2">
            <div class="flex-1">
              <FormField name="activity" v-slot="{ field }">
                <FormItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div class="relative">
                        <Input
                          v-bind="field"
                          placeholder="Enter the title..."
                          :class="{ 'pr-8': isSearching }"
                        />
                        <div v-if="isSearching" class="absolute right-3 top-2.5 animate-spin">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                          </svg>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent :class="{ hidden: searchResults.length === 0 }">
                      <DropdownMenuItem
                        v-for="(result, index) in searchResults"
                        :key="index"
                        @click="selectSearchResult(result)"
                      >
                        <div class="flex items-start space-x-3">
                          <div v-if="result.source === 'tmdb'">
                            <div class="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
                              <img
                                v-if="result.posterUrl"
                                :src="
                                  result.posterUrl?.startsWith('http')
                                    ? result.posterUrl
                                    : `https://image.tmdb.org/t/p/w92${result.posterUrl}`
                                "
                                alt="Cover"
                                class="w-full h-full object-cover"
                                @error="
                                  ($event.target as HTMLImageElement).src =
                                    'https://placehold.co/92x138?text=No+Image'
                                "
                              />
                            </div>
                            <!-- Content -->
                            <div class="flex-1 min-w-0">
                              <!-- First Row: Type | Name -->
                              <div class="flex items-center space-x-2">
                                <span
                                  class="inline-block px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground capitalize"
                                >
                                  {{
                                    form.values.mediaType === 'tv-show'
                                      ? 'TV Show'
                                      : form.values.mediaType
                                  }}
                                </span>
                                <h4 class="font-medium text-sm truncate">
                                  {{ result.title }}
                                </h4>
                              </div>

                              <!-- Second Row: Year -->
                              <div class="mt-1 text-xs text-muted-foreground">
                                {{ extractYear(result.releaseDate) }}
                              </div>
                            </div>
                          </div>
                          <div v-else-if="result.source === 'openlibrary'">
                            <div class="flex-shrink-0 w-12 h-16 bg-muted rounded overflow-hidden">
                              <img
                                v-if="result.coverUrl"
                                :src="result.coverUrl"
                                alt="Cover"
                                class="w-full h-full object-cover"
                                @error="
                                  ($event.target as HTMLImageElement).src =
                                    'https://placehold.co/92x138?text=No+Image'
                                "
                              />
                            </div>
                            <div class="flex-1 min-w-0">
                              <!-- First Row: Type | Name -->
                              <div class="flex items-center space-x-2">
                                <h4 class="font-medium text-sm truncate">
                                  {{ result.title }}
                                </h4>
                              </div>

                              <!-- Second Row: Year -->
                              <div class="mt-1 text-xs text-muted-foreground">
                                {{ result.publishYear }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
          <!-- Search status and results -->
        </CardContent>

        <CardFooter class="flex flex-col sm:flex-row justify-between gap-4 px-6">
          <Button class="w-full sm:w-[250px]" type="submit">Submit</Button>
          <Button variant="secondary" class="w-full sm:w-[250px]" type="button"> Cancel </Button>
        </CardFooter>
      </Card>
    </form>

    <!-- Activities List -->
    <Card>
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
  </div>
</template>
