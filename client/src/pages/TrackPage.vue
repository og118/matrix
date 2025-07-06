<script lang="ts" setup>
import { type MovieResult, type BookResult, search } from '@/api/search'

import { FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useActivityStore } from '@/store/activityStore'
import { Search, Loader2 } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'
import { useMotion } from '@vueuse/motion'

const { addActivity, loadActivities } = useActivityStore()

const searchResults = ref<(MovieResult | BookResult)[]>([])
const isSearching = ref(false)
const searchTimeout = ref<number | null>(null)
const hasSearchedOnce = ref(false) // Track if user has searched at least once

// Motion setup
const searchBarRef = ref<HTMLDivElement>()
const { apply } = useMotion(searchBarRef, {
  initial: {
    y: 0,
    transition: { duration: 0 },
  },
  up: {
    y: -500,
    transition: { duration: 700, ease: 'easeInOut' },
  },
})

// Watch for first search and apply animation
watch(hasSearchedOnce, (newValue) => {
  if (newValue) {
    apply('up')
  }
})

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

  // Mark that user has searched at least once
  if (!hasSearchedOnce.value) {
    hasSearchedOnce.value = true
  }

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

// Close dropdown when pressing Escape
const handleInputKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && searchResults.value.length > 0) {
    searchResults.value = []
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
  <div ref="searchBarRef" class="w-full h-full">
    <form @submit="handleCreateActivity" class="flex justify-center w-full h-full">
      <FormField name="activity" v-slot="{ field }">
        <FormItem class="w-1/2">
          <div class="flex flex-row items-center relative">
            <Input
              v-bind="field"
              placeholder="What's on your mind?"
              @keydown="handleInputKeyDown"
              class="p-8 text-foreground border border-input rounded-xl"
              style="font-size: 1.5rem"
            />
            <div v-if="isSearching" class="absolute right-4 animate-spin text-muted-foreground">
              <Loader2 :size="20" />
            </div>
            <div v-else class="absolute right-4 text-muted-foreground">
              <Search :size="20" />
            </div>
          </div>
        </FormItem>
      </FormField>
    </form>

    <!-- Search Results Section -->
    <!-- <div
      v-if="hasSearchResults"
      v-motion
      :initial="{ opacity: 0, y: 50 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 600, delay: 200, ease: 'easeOut' }"
      class="mt-8 px-4"
    >
      <div class="max-w-2xl mx-auto">
        <h3
          v-motion
          :initial="{ opacity: 0, x: -20 }"
          :animate="{ opacity: 1, x: 0 }"
          :transition="{ duration: 500, delay: 400 }"
          class="text-lg font-semibold text-foreground mb-4"
        >
          Search Results
        </h3>
        <div class="space-y-3">
          <div
            v-for="(result, index) in searchResults"
            :key="result.id"
            v-motion
            :initial="{ opacity: 0, x: -30, scale: 0.9 }"
            :animate="{ opacity: 1, x: 0, scale: 1 }"
            :transition="{
              duration: 500,
              delay: 500 + index * 100,
              ease: 'easeOut',
              type: 'spring',
              stiffness: 100,
            }"
            @click="selectSearchResult(result)"
            class="flex items-center gap-3 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <div class="flex-shrink-0 w-12 h-16 bg-muted-foreground/20 rounded overflow-hidden">
              <img
                v-if="result.poster_path || result.image"
                :src="`https://image.tmdb.org/t/p/w92${result.poster_path || result.image}`"
                :alt="result.title || result.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <Search :size="16" class="text-muted-foreground" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-foreground truncate">
                {{ result.title || result.name }}
              </h4>
              <p class="text-sm text-muted-foreground truncate">
                {{ extractYear(result.release_date || result.first_air_date || '') }}
              </p>
              <p v-if="result.overview" class="text-sm text-muted-foreground mt-1 line-clamp-2">
                {{ result.overview }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div> -->
  </div>
</template>
