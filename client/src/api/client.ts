// src/api/client.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.WORKER_URL || 'http://localhost:8787',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient
