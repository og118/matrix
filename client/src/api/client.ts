// src/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_WORKER_URL || 'http://localhost:8787',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
