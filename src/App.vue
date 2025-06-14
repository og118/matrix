<script setup lang="ts">
import { Button } from './components/ui/button'
import { CalendarInput } from './components/ui/calendar'
import { Card } from './components/ui/card'
import { Toaster } from './components/ui/sonner'
</script>

<template>
  <Toaster />
  <Card>
    <CalendarInput form-label=""></CalendarInput>
    <Button>Submit</Button>
  </Card>
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
