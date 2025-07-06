<script lang="ts" setup>
import { type MovieResult, type BookResult, search } from '@/api/search'

import { FormField, FormItem } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useActivityStore } from '@/store/activityStore'
import { Search, Loader2 } from 'lucide-vue-next'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import z from 'zod'
import { useMotion } from '@vueuse/motion'
import { placeholder } from '@/utils/placeholdImage'

const { addActivity, loadActivities } = useActivityStore()

const searchResults = ref<(MovieResult | BookResult)[]>([])
const isSearching = ref(false)
const searchTimeout = ref<number | null>(null)
const hasSearchedOnce = ref(false) // Track if user has searched at least once
const hasSearchResults = computed(() => searchResults.value.length > 0)

// Motion setup
const searchBarRef = ref<HTMLDivElement>()
const { apply } = useMotion(searchBarRef, {
  initial: {
    y: '42.5vh',
    transition: { duration: 0 },
  },
  up: {
    y: '2.5vh',
    transition: { duration: 1000, ease: 'easeInOut' },
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

// Generate responsive placeholder dimensions
const getPlaceholderDimensions = () => {
  return { width: 96, height: 128 }
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
  <div class="flex flex-col flex-1 items-center justify-center">
    <div ref="searchBarRef">
      <form @submit="handleCreateActivity" class="flex flex-row justify-center">
        <FormField name="activity" v-slot="{ field }">
          <FormItem>
            <div class="flex flex-row items-center relative">
              <Input
                v-bind="field"
                placeholder="What's on your mind?"
                @keydown="handleInputKeyDown"
                class="px-8 text-foreground border border-input rounded-xl w-[50vw] h-[5vh]"
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
    </div>
    <!-- Search Results Section -->
    <div class="flex flex-1 w-[50vw] justify-start">
      <div
        v-if="hasSearchResults"
        v-motion
        :initial="{ opacity: 0, y: '2.5vh' }"
        :enter="{ opacity: 1, y: '2.5vh', transition: { duration: 500, delay: 300 } }"
      >
        <div
          v-for="(result, idx) in searchResults"
          :key="idx"
          class="flex items-center p-4 hover:bg-muted/50 transition-colors"
        >
          <!-- Book Result -->
          <div v-if="result.source === 'openlibrary'" class="flex items-center w-full">
            <div
              class="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 bg-muted-foreground rounded overflow-hidden mr-4 flex-shrink-0"
            >
              <img
                v-if="result.title"
                :src="
                  result.coverUrl ||
                  placeholder(
                    getPlaceholderDimensions().width,
                    getPlaceholderDimensions().height,
                    result.title,
                  )
                "
                :alt="result.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="font-medium text-foreground truncate">
                {{ result.title }}
              </h4>
              <p class="text-sm text-muted-foreground truncate">
                {{ result.publishYear }}
              </p>
              <p v-if="result.authors" class="text-sm text-muted-foreground mt-1 line-clamp-2">
                {{ result.authors.toString() }}
              </p>
            </div>
          </div>
          <!-- Movie Result -->
          <div v-if="result.source === 'tmdb'" class="flex items-center w-full">
            <div
              class="w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-32 bg-muted-foreground rounded overflow-hidden mr-4 flex-shrink-0"
            >
              <img
                v-if="result.title"
                :src="
                  result.posterUrl ||
                  placeholder(
                    getPlaceholderDimensions().width,
                    getPlaceholderDimensions().height,
                    result.title,
                  )
                "
                :alt="result.title"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1 min-w-0 px-5">
              <h4 class="font-medium text-foreground truncate">
                {{ result.title }}
              </h4>
              <p class="text-sm text-muted-foreground truncate">
                {{ extractYear(result.releaseDate) }}
              </p>
              <p v-if="result.rating" class="text-sm text-muted-foreground mt-1 line-clamp-2">
                {{ result.rating }} / 10
              </p>
            </div>
          </div>
          <!-- Horizontal separator line (except for last item) -->
          <div
            v-if="idx < searchResults.length - 1"
            class="absolute left-4 right-4 h-px bg-border"
            :style="{ top: '100%' }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
