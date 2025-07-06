<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import { Toaster } from './components/ui/sonner'
import 'vue-sonner/style.css' // vue-sonner v2 requires this import
</script>

<template>
  <div class="min-h-screen min-w-screen flex flex-col bg-background">
    <NavBar />
    <div class="flex-1 flex flex-col">
      <router-view />
    </div>
    <Toaster />
  </div>
</template>
