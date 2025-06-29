import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './routers'
import { initializeDatabase } from './database/db'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize the database
initializeDatabase().then(() => {
  console.log('Database initialized')
})

app.mount('#app')
