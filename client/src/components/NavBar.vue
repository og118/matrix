<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { Button } from './ui/button'
import { Moon } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode({
  attribute: 'theme',
  modes: {
    light: 'light',
    dark: 'dark',
    starryNight: 'starry-night',
  },
})
</script>

<template>
  <div class="w-full">
    <div class="container flex h-14 max-w-screen-2xl items-center justify-center">
      <div class="flex items-center justify-center">
        <NavigationMenu class="bg-secondary w-full rounded-xl">
          <NavigationMenuList>
            <NavigationMenuItem>
              <router-link to="/" custom v-slot="{ isActive, href, navigate }">
                <NavigationMenuLink
                  :class="[
                    'rounded-xl px-4',
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground',
                  ]"
                  :href="href"
                  @click="navigate"
                >
                  <h1>Activity</h1>
                </NavigationMenuLink>
              </router-link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <router-link to="/track" custom v-slot="{ isActive, href, navigate }">
                <NavigationMenuLink
                  :class="[
                    'rounded-xl px-4',
                    isActive ? 'text-foreground font-bold' : 'text-muted-foreground',
                  ]"
                  :href="href"
                  @click="navigate"
                >
                  Track
                </NavigationMenuLink>
              </router-link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Button
                class="bg-secondary hover:bg-secondary/80"
                @click="mode = mode === 'dark' ? 'light' : 'dark'"
              >
                <Moon class="text-foreground hover:!text-background transition-colors" />
              </Button>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Additional styling for active navigation items */
:deep(.router-link-active) {
  position: relative;
}

:deep(.router-link-active)::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: hsl(var(--foreground));
}
</style>
