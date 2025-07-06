<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
import { Button } from './ui/button'
import { Moon, Sun } from 'lucide-vue-next'
import { useColorMode } from '@vueuse/core'

const mode = useColorMode()
</script>

<template>
  <div class="w-full">
    <div class="flex h-[5vh] items-center justify-center">
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
                class="group bg-secondary hover:bg-foreground"
                @click="mode = mode === 'light' ? 'dark' : 'light'"
              >
                <Sun
                  v-if="mode === 'dark'"
                  class="h-[1.2rem] w-[1.2rem] text-foreground group-hover:text-background transition-colors"
                />
                <Moon
                  v-else
                  class="h-[1.2rem] w-[1.2rem] text-foreground group-hover:text-background transition-colors"
                />
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
