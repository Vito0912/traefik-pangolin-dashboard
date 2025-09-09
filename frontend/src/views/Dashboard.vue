<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Traefik Dashboard</h1>

      <div v-if="stats">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            :value="Math.round(stats.averageResponseTime / 1e6)"
            unit="ms"
            description="Average Response Time"
          />

          <StatsCard :value="stats.totalRequests" description="Total Requests" />

          <StatsCard :value="prettyBytes(stats.totalBytes)" description="Total Data" />

          <StatsCard :value="stats.requestsByService.length" description="Total Services" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/StatsCard.vue'

import axios from 'axios'
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted } from 'vue'
import type { StatsApiResponse } from '../../../types/apiResponses'

const stats = ref<StatsApiResponse | null>(null)

onMounted(async () => {
  try {
    stats.value = (await axios.get('http://127.0.0.1:3000/api/logs/stats')).data
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
})

const prettyBytes = (num: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  while (num >= 1024 && unitIndex < units.length - 1) {
    num /= 1024
    unitIndex++
  }
  return `${num.toFixed(2)} ${units[unitIndex]}`
}
</script>
