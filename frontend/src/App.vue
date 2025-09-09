<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div class="container mx-auto flex items-center justify-between p-4">
      <nav>
        <RouterLink to="/">Dashboard</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
