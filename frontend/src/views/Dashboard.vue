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
import type { StatsApiResponse, LogEntry } from '../../../types/apiResponses'
import { io } from 'socket.io-client'

const stats = ref<StatsApiResponse | null>(null)

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
    stats.value.requestsByUserAgent.map((u) => [u['Request_User-Agent'], u.count]),
  )

  data.forEach((log) => {
    const status = log.DownstreamStatus?.toString() || 'unknown'
    const service = log.ServiceName ?? '__undefined__'
    const client = log.ClientHost || 'unknown'
    const path = log.RequestPath || 'unknown'
    const userAgent = log['request_User-Agent'] || 'unknown'

    statusMap.set(status, (statusMap.get(status) || 0) + 1)
    serviceMap.set(service, (serviceMap.get(service) || 0) + 1)
    clientMap.set(client, (clientMap.get(client) || 0) + 1)
    pathMap.set(path, (pathMap.get(path) || 0) + 1)
    userAgentMap.set(userAgent, (userAgentMap.get(userAgent) || 0) + 1)
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
      'Request_User-Agent': userAgent,
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
