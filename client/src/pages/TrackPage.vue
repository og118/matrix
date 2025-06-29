<script lang="ts" setup>
import { type MovieResult, type BookResult, search } from '@/api/search'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { useActivityStore } from '@/store/activityStore'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'

const { addActivity, loadActivities } = useActivityStore()

const searchResults = ref<(MovieResult | BookResult)[]>([])
const isSearching = ref(false)
const searchTimeout = ref<number | null>(null)
const dropdownContainer = ref<HTMLElement | null>(null)

const formSchema = toTypedSchema(
  z.object({
    activity: z.string().min(2).max(50),
    mediaType: z.enum(['movie', 'book', 'tv-show']).default('movie'),
  }),
)

const form = useForm({
  validationSchema: formSchema,
})

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

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (dropdownContainer.value && !dropdownContainer.value.contains(event.target as Node)) {
    searchResults.value = []
  }
}

// Close dropdown when pressing Escape
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    searchResults.value = []
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeyDown)
})

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
    await addActivity({
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
</script>
<template>
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
                <div class="relative" ref="dropdownContainer">
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

                  <!-- Search Results Dropdown -->
                  <div
                    v-if="searchResults.length > 0"
                    class="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-80 overflow-y-auto"
                  >
                    <div
                      v-for="(result, index) in searchResults"
                      :key="index"
                      @click="selectSearchResult(result)"
                      class="flex items-start space-x-3 p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
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
                    </div>
                  </div>
                </div>
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
</template>
