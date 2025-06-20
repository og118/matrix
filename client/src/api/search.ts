import apiClient from './client'

export interface MovieResult {
  id: number
  title: string
  overview: string
  releaseDate: string
  posterUrl: string | null
  rating: number
  source: 'tmdb'
}

export interface BookResult {
  key: string
  title: string
  authors: string[]
  publishYear: number | null
  coverUrl: string | null
  isbn: string[]
  subjects: string[]
  source: 'openlibrary'
}

interface SearchResponse {
  results: (MovieResult | BookResult)[]
  totalResults: number
  page: number
  totalPages?: number
}

export const search = async (query: string, type: 'book' | 'movie') => {
  try {
    const response = await apiClient.get<SearchResponse>(
      `/api/search?q=${encodeURIComponent(query)}&type=${type}`,
    )
    return response.data.results
  } catch (error) {
    console.error('Search API error:', error)
    throw error
  }
}
