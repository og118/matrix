<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'
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
                  :class="['rounded-xl px-4', isActive ? 'text-black font-bold' : 'text-gray-600']"
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
                  :class="['rounded-xl px-4', isActive ? 'text-black font-bold' : 'text-gray-600']"
                  :href="href"
                  @click="navigate"
                >
                  Track
                </NavigationMenuLink>
              </router-link>
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
  background-color: black;
}
</style>
