<template>
  <div class="min-h-screen bg-gray-900 p-6">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Traefik Dashboard</h1>

      <div v-if="stats">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div class="lg:col-span-2">
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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
              <PercentageList
                title="Requests by Service"
                :items="serviceItems"
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

          <div class="lg:col-span-1">
            <StatusCodePieChart title="HTTP Status Codes" :status-codes="stats.requestsByStatus" />
          </div>
        </div>

        <div class="mt-8">
          <LogFilter
            :stats="stats"
            :get-proper-service-name="getProperServiceName"
            @filter-change="handleFilterChange"
          />

          <LogTable
            :logs="logs"
            title="Recent Log Entries"
            :sort-by="sortBy"
            :sort-direction="sortDirection"
            :get-proper-service-name="getProperServiceName"
            @sort="handleSort"
          />

          <div v-if="pagination" class="bg-gray-800 rounded-lg border border-gray-700 mt-4 p-4">
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div class="flex items-center gap-4">
                <div class="text-sm text-gray-300">
                  Showing {{ (pagination.page - 1) * pagination.limit + 1 }} to
                  {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of
                  {{ pagination.total }} entries
                </div>

                <div class="flex items-center gap-2">
                  <label for="pageSize" class="text-sm text-gray-300">Show:</label>
                  <select
                    id="pageSize"
                    v-model="pageSize"
                    @change="handlePageSizeChange"
                    class="bg-gray-700 text-gray-300 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                    <option value="250">250</option>
                    <option value="500">500</option>
                    <option value="1000">1000</option>
                  </select>
                  <span class="text-sm text-gray-300">per page</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  @click="handlePageChange(currentPage - 1)"
                  :disabled="currentPage <= 1"
                  class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>

                <div class="flex items-center gap-1">
                  <button
                    v-for="page in visiblePages"
                    :key="page"
                    @click="handlePageChange(page)"
                    :class="[
                      'px-3 py-1 text-sm rounded transition-colors',
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
                    ]"
                  >
                    {{ page }}
                  </button>
                </div>

                <button
                  @click="handlePageChange(currentPage + 1)"
                  :disabled="currentPage >= pagination.pages"
                  class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import StatsCard from '@/components/StatsCard.vue'
import PercentageList from '@/components/PercentageList.vue'
import LogTable from '@/components/LogTable.vue'
import LogFilter from '@/components/LogFilter.vue'
import StatusCodePieChart from '@/components/StatusCodePieChart.vue'
import type { FilterValues } from '../../../types/apiResponses'

import axios from 'axios'
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, computed } from 'vue'
import type {
  StatsApiResponse,
  LogEntry,
  PercentageListItem,
  LogsApiResponse,
  Pagination,
} from '../../../types/apiResponses'
import { io } from 'socket.io-client'

interface PangolinServiceData {
  fullDomain: string
  name: string
  orgId: string
  resourceId: number
}

const stats = ref<StatsApiResponse | null>(null)
const logs = ref<LogEntry[]>([])
const pagination = ref<Pagination | null>(null)
const sortBy = ref<string[]>(['time'])
const sortDirection = ref<string[]>(['desc'])
const currentPage = ref<number>(1)
const pageSize = ref<number>(100)
const pangolinServiceData = ref<PangolinServiceData[]>([])
const activeFilters = ref<FilterValues>({
  ClientHost: [],
  not_ClientHost: [],
  RequestMethod: [],
  not_RequestMethod: [],
  RequestPath: [],
  not_RequestPath: [],
  DownstreamStatus: [],
  not_DownstreamStatus: [],
  ServiceName: [],
  not_ServiceName: [],
  requestUserAgent: [],
  not_requestUserAgent: [],
})

const handleFilterChange = (filters: FilterValues) => {
  activeFilters.value = filters
  currentPage.value = 1
  fetchLogs()
}

const handleSort = (payload: { sortBy: string[]; sortDirection: string[] }) => {
  sortBy.value = payload.sortBy
  sortDirection.value = payload.sortDirection
  currentPage.value = 1
  fetchLogs()
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchLogs()
}

const handlePageSizeChange = () => {
  currentPage.value = 1
  fetchLogs()
}

const fetchLogs = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('limit', pageSize.value.toString())
    if (sortBy.value.length > 0) {
      params.append('sortBy', sortBy.value.join(','))
      params.append('direction', sortDirection.value.join(','))
    }
    Object.entries(activeFilters.value).forEach(([key, values]) => {
      if (values.length > 0) {
        let apiKey = key
        if (key === 'requestUserAgent') {
          apiKey = 'requestUser-Agent'
        } else if (key === 'not_requestUserAgent') {
          apiKey = 'not_requestUser-Agent'
        }

        let apiValues = values
        if ((key === 'ServiceName' || key === 'not_ServiceName') && values.includes('Invalid')) {
          apiValues = values.map((value) => (value === 'Invalid' ? 'null' : value))
        }

        params.append(apiKey, apiValues.join(','))
      }
    })

    const response = (await axios.get(`/api/logs?${params.toString()}`)).data as LogsApiResponse
    logs.value = response.logs
    pagination.value = response.pagination
  } catch (error) {
    console.error('Error fetching logs:', error)
  }
}

const fetchStats = async () => {
  try {
    stats.value = (await axios.get('/api/logs/stats')).data
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

const fetchPangolinServiceData = async () => {
  try {
    const response = await axios.get('/api/pangolin')
    pangolinServiceData.value = response.data
  } catch (error) {
    console.error('Error fetching Pangolin service data:', error)
  }
}

const getProperServiceName = (serviceName: string | undefined): string => {
  if (!serviceName) return 'Invalid'

  const pangolinService = pangolinServiceData.value.find(
    (service) => `${service.resourceId}-service@http` === serviceName,
  )
  if (serviceName === 'next-service@file') return 'Pangolin'
  if (serviceName === 'api-service@file') return 'Pangolin API'

  if (pangolinService) {
    return pangolinService.name || serviceName
  }

  return serviceName || 'Invalid'
}

// Computed properties for PercentageList data
const serviceItems = computed((): PercentageListItem[] => {
  if (!stats.value) return []
  return stats.value.requestsByService
    .map((item) => ({
      name: getProperServiceName(item.ServiceName),
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

const visiblePages = computed((): number[] => {
  if (!pagination.value) return []

  const current = currentPage.value
  const total = pagination.value.pages
  const delta = 2

  const range = []
  const rangeWithDots = []

  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    range.push(i)
  }

  if (current - delta > 2) {
    rangeWithDots.push(1, -1)
  } else {
    rangeWithDots.push(1)
  }

  rangeWithDots.push(...range)

  if (current + delta < total - 1) {
    rangeWithDots.push(-1, total)
  } else if (total > 1) {
    rangeWithDots.push(total)
  }

  return rangeWithDots.filter((page) => page > 0)
})

onMounted(async () => {
  await Promise.all([fetchStats(), fetchLogs(), fetchPangolinServiceData()])
})

const socket = io()
socket.on('connect', async () => {
  console.log('Connected to WebSocket server')
  await fetchStats()
})
socket.on('newLogs', (data: LogEntry[]) => {
  if (!stats.value) return

  // To prevent to a pagination lag, the log table only get's updated if only sorted by time descending and on the first page
  // TODO: Actually handle the insertion with filters
  const hasActiveFilters = Object.values(activeFilters.value).some(
    (filterArray) => filterArray.length > 0,
  )
  if (
    sortBy.value[0] === 'time' &&
    sortDirection.value[0] === 'desc' &&
    currentPage.value === 1 &&
    sortBy.value.length === 1 &&
    sortDirection.value.length === 1 &&
    hasActiveFilters === false
  ) {
    logs.value = [...data, ...logs.value].slice(0, pageSize.value)
    console.log(`Received ${data.length} new logs via WebSocket`)
  }

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
