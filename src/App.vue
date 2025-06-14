<script setup lang="ts">
import BaseButton from './components/ui/button/BaseButton.vue'
import BaseCalendarInput from './components/ui/calendar/BaseCalendarInput.vue'
import { Toaster } from './components/ui/sonner'
</script>

<template>
  <Toaster />
  <BaseCalendarInput form-label=""></BaseCalendarInput>
  <BaseButton>Submit</BaseButton>
</template>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
