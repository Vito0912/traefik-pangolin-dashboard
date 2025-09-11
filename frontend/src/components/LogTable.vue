<template>
  <div
    class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl hover:border-gray-600 transition-all duration-200 flex flex-col"
  >
    <div class="p-6 flex-shrink-0">
      <h3 v-if="title" class="text-lg font-semibold text-white mb-4">{{ title }}</h3>
    </div>

    <div class="overflow-x-auto overflow-y-auto max-h-160 flex-1 px-6 pb-6">
      <table class="min-w-full table-auto">
        <thead>
          <tr class="border-b border-gray-600">
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Time
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Client Host
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Method
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Service
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Path
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
            >
              Duration
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-600">
          <tr
            v-for="log in logs"
            :key="`${log.time}-${log.ClientHost}-${log.RequestPath}`"
            class="hover:bg-gray-700 transition-colors duration-150"
          >
            <td class="px-4 py-3 text-sm text-white whitespace-nowrap">
              {{ formatTime(log.time) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-200">
              {{ log.ClientHost || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-200">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getMethodClass(log.RequestMethod)"
              >
                {{ log.RequestMethod || '-' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-200">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getServiceClass(log.ServiceName)"
              >
                {{ getServiceName(log.ServiceName) }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-200 max-w-xs truncate" :title="log.RequestPath">
              {{ log.RequestPath || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-200 text-right">
              {{ formatBytes(log.DownstreamContentSize) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-200 text-right">
              {{ formatDuration(log.Duration) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="logs.length === 0" class="text-center py-8">
        <span class="text-gray-400 text-sm">No log entries available</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LogEntry } from '../../../types/apiResponses'

interface Props {
  logs: LogEntry[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Log Entries',
})

const formatTime = (timeString: string): string => {
  try {
    const date = new Date(timeString)
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return timeString
  }
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let unitIndex = 0
  let size = bytes

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

const formatDuration = (duration: number): string => {
  if (!duration || duration === 0) return '0ms'

  const ms = duration / 1_000_000

  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`
  } else {
    return `${(ms / 1000).toFixed(2)}s`
  }
}

const getMethodClass = (method: string): string => {
  const methodClasses: Record<string, string> = {
    GET: 'bg-green-900 text-green-200',
    POST: 'bg-blue-900 text-blue-200',
    PUT: 'bg-yellow-900 text-yellow-200',
    DELETE: 'bg-red-900 text-red-200',
    PATCH: 'bg-purple-900 text-purple-200',
    HEAD: 'bg-gray-700 text-gray-200',
    OPTIONS: 'bg-indigo-900 text-indigo-200',
  }

  return methodClasses[method?.toUpperCase()] || 'bg-gray-700 text-gray-200'
}

const getServiceClass = (service?: string): string => {
  const serviceClasses: Record<string, string> = {
    undefined: 'bg-red-900/30',
    'next-service@file': 'bg-green-900/40',
    'api-service@file': 'bg-blue-900/40',
  }
  // @ts-ignore
  return serviceClasses[service?.toLowerCase()] || 'bg-gray-700 text-gray-200'
}

const getServiceName = (service?: string): string => {
  if (!service) return 'Invalid'
  if (service === 'next-service@file') return 'Pangolin'
  if (service === 'api-service@file') return 'Pangolin API'
  return service
}
</script>
