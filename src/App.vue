<script setup lang="ts">
import HomePage from './pages/HomePage.vue'
import { Toaster } from './components/ui/sonner'
import 'vue-sonner/style.css' // vue-sonner v2 requires this import
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-background">
    <h1 class="text-2xl font-bold mb-4">Welcome to the Matrix</h1>

    <HomePage />
    <Toaster />
  </div>
</template>
