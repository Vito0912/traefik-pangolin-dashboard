<template>
  <div
    class="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col"
  >
    <div class="p-6 flex-shrink-0">
      <h3 v-if="title" class="text-lg font-semibold text-gray-800 mb-4">{{ title }}</h3>
    </div>

    <div class="overflow-x-auto overflow-y-auto max-h-80 flex-1 px-6 pb-6">
      <table class="min-w-full table-auto">
        <thead>
          <tr class="border-b border-gray-200">
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Time
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Client Host
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Method
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Service
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Path
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Size
            </th>
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Duration
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr
            v-for="log in logs"
            :key="`${log.time}-${log.ClientHost}-${log.RequestPath}`"
            class="hover:bg-gray-50 transition-colors duration-150"
          >
            <td class="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
              {{ formatTime(log.time) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ log.ClientHost || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              <span
                class="px-2 py-1 text-xs font-medium rounded-full"
                :class="getMethodClass(log.RequestMethod)"
              >
                {{ log.RequestMethod || '-' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-700">
              {{ log.ServiceName || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" :title="log.RequestPath">
              {{ log.RequestPath || '-' }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 text-right">
              {{ formatBytes(log.DownstreamContentSize) }}
            </td>
            <td class="px-4 py-3 text-sm text-gray-700 text-right">
              {{ formatDuration(log.Duration) }}
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="logs.length === 0" class="text-center py-8">
        <span class="text-gray-500 text-sm">No log entries available</span>
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
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800',
    PATCH: 'bg-purple-100 text-purple-800',
    HEAD: 'bg-gray-100 text-gray-800',
    OPTIONS: 'bg-indigo-100 text-indigo-800',
  }

  return methodClasses[method?.toUpperCase()] || 'bg-gray-100 text-gray-800'
}
</script>
