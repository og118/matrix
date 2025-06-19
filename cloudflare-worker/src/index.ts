// Cloudflare Worker for searching movies and books
export interface Env {
  TMDB_API_KEY?: string
}

// Types for API responses
interface TMDBMovie {
  id: number
  title: string
  overview: string
  release_date: string
  poster_path: string | null
  vote_average: number
  genre_ids: number[]
}

interface TMDBSearchResponse {
  results: TMDBMovie[]
  total_results: number
  total_pages: number
}

interface OpenLibraryBook {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  isbn?: string[]
  subject?: string[]
}

interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[]
  numFound: number
  start: number
}

// API response interfaces
interface MovieResult {
  id: number
  title: string
  overview: string
  releaseDate: string
  posterUrl: string | null
  rating: number
  source: 'tmdb'
}

interface BookResult {
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

interface ErrorResponse {
  error: string
  message: string
}

// Helper functions
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function createErrorResponse(error: string, message: string, status: number = 400): Response {
  const errorResponse: ErrorResponse = { error, message }
  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: corsHeaders(),
  })
}

async function searchMovies(
  query: string,
  page: number = 1,
  apiKey?: string,
): Promise<MovieResult[]> {
  if (!apiKey) {
    throw new Error('TMDB API key is required')
  }

  const url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&page=${page}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status}`)
  }

  const data: TMDBSearchResponse = await response.json()

  return data.results.map(
    (movie): MovieResult => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      releaseDate: movie.release_date,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      rating: movie.vote_average,
      source: 'tmdb',
    }),
  )
}

async function searchBooks(
  query: string,
  page: number = 1,
  limit: number = 20,
): Promise<BookResult[]> {
  const offset = (page - 1) * limit
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`OpenLibrary API error: ${response.status}`)
  }

  const data: OpenLibrarySearchResponse = await response.json()

  return data.docs.map(
    (book): BookResult => ({
      key: book.key,
      title: book.title,
      authors: book.author_name || [],
      publishYear: book.first_publish_year || null,
      coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : null,
      isbn: book.isbn || [],
      subjects: book.subject || [],
      source: 'openlibrary',
    }),
  )
}

// Main worker handler
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }

    const url = new URL(request.url)
    const path = url.pathname

    try {
      // Movies search endpoint
      if (path === '/api/movies/search') {
        if (request.method !== 'GET') {
          return createErrorResponse('method_not_allowed', 'Only GET method is allowed', 405)
        }

        const query = url.searchParams.get('q')
        if (!query) {
          return createErrorResponse('missing_query', 'Query parameter "q" is required')
        }

        const page = parseInt(url.searchParams.get('page') || '1')
        if (page < 1) {
          return createErrorResponse('invalid_page', 'Page must be a positive integer')
        }

        const movies = await searchMovies(query, page, env.TMDB_API_KEY)
        const response: SearchResponse = {
          results: movies,
          totalResults: movies.length,
          page,
        }

        return new Response(JSON.stringify(response), { headers: corsHeaders() })
      }

      // Books search endpoint
      if (path === '/api/books/search') {
        if (request.method !== 'GET') {
          return createErrorResponse('method_not_allowed', 'Only GET method is allowed', 405)
        }

        const query = url.searchParams.get('q')
        if (!query) {
          return createErrorResponse('missing_query', 'Query parameter "q" is required')
        }

        const page = parseInt(url.searchParams.get('page') || '1')
        if (page < 1) {
          return createErrorResponse('invalid_page', 'Page must be a positive integer')
        }

        const limit = parseInt(url.searchParams.get('limit') || '20')
        if (limit < 1 || limit > 100) {
          return createErrorResponse('invalid_limit', 'Limit must be between 1 and 100')
        }

        const books = await searchBooks(query, page, limit)
        const response: SearchResponse = {
          results: books,
          totalResults: books.length,
          page,
        }

        return new Response(JSON.stringify(response), { headers: corsHeaders() })
      }

      // Combined search endpoint
      if (path === '/api/search') {
        if (request.method !== 'GET') {
          return createErrorResponse('method_not_allowed', 'Only GET method is allowed', 405)
        }

        const query = url.searchParams.get('q')
        if (!query) {
          return createErrorResponse('missing_query', 'Query parameter "q" is required')
        }

        const type = url.searchParams.get('type')
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = parseInt(url.searchParams.get('limit') || '20')

        if (page < 1) {
          return createErrorResponse('invalid_page', 'Page must be a positive integer')
        }

        let results: (MovieResult | BookResult)[] = []

        if (!type || type === 'movies') {
          if (env.TMDB_API_KEY) {
            try {
              const movies = await searchMovies(query, page, env.TMDB_API_KEY)
              results = results.concat(movies)
            } catch (error) {
              console.error('Movie search error:', error)
            }
          }
        }

        if (!type || type === 'books') {
          try {
            const books = await searchBooks(query, page, limit)
            results = results.concat(books)
          } catch (error) {
            console.error('Book search error:', error)
          }
        }

        const response: SearchResponse = {
          results,
          totalResults: results.length,
          page,
        }

        return new Response(JSON.stringify(response), { headers: corsHeaders() })
      }

      // API documentation endpoint
      if (path === '/api' || path === '/api/') {
        const documentation = {
          name: 'Movies & Books Search API',
          version: '1.0.0',
          description: 'Search for movies using TMDB and books using OpenLibrary',
          endpoints: {
            '/api/movies/search': {
              method: 'GET',
              description: 'Search for movies using TMDB',
              parameters: {
                q: 'Search query (required)',
                page: 'Page number (optional, default: 1)',
              },
              example: '/api/movies/search?q=inception&page=1',
            },
            '/api/books/search': {
              method: 'GET',
              description: 'Search for books using OpenLibrary',
              parameters: {
                q: 'Search query (required)',
                page: 'Page number (optional, default: 1)',
                limit: 'Results per page (optional, default: 20, max: 100)',
              },
              example: '/api/books/search?q=harry%20potter&page=1&limit=10',
            },
            '/api/search': {
              method: 'GET',
              description: 'Search for both movies and books',
              parameters: {
                q: 'Search query (required)',
                type: 'Filter by type: "movies" or "books" (optional, searches both if not specified)',
                page: 'Page number (optional, default: 1)',
                limit: 'Results per page for books (optional, default: 20, max: 100)',
              },
              example: '/api/search?q=lord%20of%20the%20rings&type=books',
            },
          },
        }

        return new Response(JSON.stringify(documentation, null, 2), { headers: corsHeaders() })
      }

      // Health check endpoint
      if (path === '/health') {
        return new Response(
          JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
          {
            headers: corsHeaders(),
          },
        )
      }

      // 404 for unknown paths
      return createErrorResponse('not_found', 'Endpoint not found', 404)
    } catch (error) {
      console.error('Worker error:', error)
      return createErrorResponse('internal_error', 'Internal server error', 500)
    }
  },
}
