<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <header class="bg-gray-800 border-b border-gray-700">
      <div class="container mx-auto flex items-center justify-between p-4">
        <nav>
          <RouterLink
            to="/"
            class="text-white hover:text-blue-400 text-xl font-semibold transition-colors duration-200"
          >
            Dashboard
          </RouterLink>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>
