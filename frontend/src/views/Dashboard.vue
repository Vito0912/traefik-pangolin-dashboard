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

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <PercentageList
            title="Requests by Service"
            :items="serviceItems"
            :maximum="stats.totalRequests"
          />

          <PercentageList
            title="Requests by Status Code"
            :items="statusItems"
            :maximum="stats.totalRequests"
          />

          <PercentageList title="Top Paths" :items="pathItems" :maximum="stats.totalRequests" />

          <PercentageList
            title="Top User Agents"
            :items="userAgentItems"
            :maximum="stats.totalRequests"
          />

          <PercentageList
            title="Top Client Hosts"
            :items="clientItems"
            :maximum="stats.totalRequests"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/StatsCard.vue'
import PercentageList from '@/components/PercentageList.vue'

import axios from 'axios'
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import type { StatsApiResponse, LogEntry, PercentageListItem } from '../../../types/apiResponses'
import { io } from 'socket.io-client'

const stats = ref<StatsApiResponse | null>(null)

// Computed properties for PercentageList data
const serviceItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByService
    .map((item) => ({
      name: item.ServiceName || 'Unknown Service',
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
})

const statusItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByStatus
    .map((item) => ({
      name: `HTTP ${item.DownstreamStatus}`,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
})

const clientItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByClients
    .map((item) => ({
      name: item.ClientHost,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
})

const pathItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByPaths
    .map((item) => ({
      name: item.RequestPath,
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
})

const userAgentItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByUserAgent
    .map((item) => ({
      name: item['request_User-Agent'],
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value)
})

onMounted(async () => {
  try {
    stats.value = (await axios.get('http://127.0.0.1:3000/api/logs/stats')).data
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
})

const socket = io('http://127.0.0.1:3000')
socket.on('connect', () => {
  console.log('Connected to WebSocket server')
})
socket.on('newLogs', (data: LogEntry[]) => {
  if (!stats.value) return

  console.log('Received new logs:', data)

  const newRequests = data.length
  const newBytes = data.reduce(
    (sum: number, log: LogEntry) => sum + (log.DownstreamContentSize || 0),
    0,
  )
  const newDuration = data.reduce((sum: number, log: LogEntry) => sum + (log.Duration || 0), 0)

  const updatedTotalRequests = stats.value.totalRequests + newRequests
  const updatedTotalBytes = stats.value.totalBytes + newBytes
  const updatedAverageResponseTime =
    (stats.value.averageResponseTime * stats.value.totalRequests + newDuration) /
    updatedTotalRequests

  const statusMap = new Map(
    stats.value.requestsByStatus.map((s) => [s.DownstreamStatus.toString(), s.count]),
  )
  const serviceMap = new Map(
    stats.value.requestsByService.map((s) => [s.ServiceName ?? '__undefined__', s.count]),
  )
  const clientMap = new Map(stats.value.requestsByClients.map((c) => [c.ClientHost, c.count]))
  const pathMap = new Map(stats.value.requestsByPaths.map((p) => [p.RequestPath, p.count]))
  const userAgentMap = new Map(
    stats.value.requestsByUserAgent.map((u) => [u['request_User-Agent'], u.count]),
  )

  data.forEach((log) => {
    const status = log.DownstreamStatus?.toString() || 'unknown'
    const service = log.ServiceName ?? '__undefined__'
    const client = log.ClientHost || 'unknown'
    const path = log.RequestPath || 'unknown'
    const userAgent = log['request_User-Agent'] || 'unknown'

    statusMap.set(status, (statusMap.get(status) || 0) + 1)
    serviceMap.set(service, (serviceMap.get(service) || 0) + 1)
    if (clientMap.get(client) !== undefined) {
      clientMap.set(client, (clientMap.get(client) || 0) + 1)
    }
    if (pathMap.get(path) !== undefined) {
      pathMap.set(path, (pathMap.get(path) || 0) + 1)
    }
    if (userAgentMap.get(userAgent) !== undefined) {
      userAgentMap.set(userAgent, (userAgentMap.get(userAgent) || 0) + 1)
    }
  })

  const updatedRequestsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    DownstreamStatus: parseInt(status) || 0,
    count,
  }))

  const updatedRequestsByService = Array.from(serviceMap.entries()).map(([ServiceName, count]) => ({
    ServiceName: ServiceName === '__undefined__' ? undefined : ServiceName,
    count,
  }))

  const updatedRequestsByClients = Array.from(clientMap.entries()).map(([ClientHost, count]) => ({
    ClientHost,
    count,
  }))

  const updatedRequestsByPaths = Array.from(pathMap.entries()).map(([RequestPath, count]) => ({
    RequestPath,
    count,
  }))

  const updatedRequestsByUserAgent = Array.from(userAgentMap.entries()).map(
    ([userAgent, count]) => ({
      'request_User-Agent': userAgent,
      count,
    }),
  )

  console.log(updatedRequestsByService)

  stats.value = {
    ...stats.value,
    totalRequests: updatedTotalRequests,
    totalBytes: updatedTotalBytes,
    averageResponseTime: updatedAverageResponseTime,
    requestsByStatus: updatedRequestsByStatus,
    requestsByService: updatedRequestsByService,
    requestsByClients: updatedRequestsByClients,
    requestsByPaths: updatedRequestsByPaths,
    requestsByUserAgent: updatedRequestsByUserAgent,
  }
})

const prettyBytes = (num: number) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  while (num >= 1024 && unitIndex < units.length - 1) {
    num /= 1024
    unitIndex++
  }
  return `${num.toFixed(4)} ${units[unitIndex]}`
}
</script>
