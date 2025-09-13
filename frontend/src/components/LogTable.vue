<template>
  <div
    class="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:shadow-xl hover:border-gray-600 transition-all duration-200 flex flex-col"
  >
    <div class="py-3 px-6 flex-shrink-0">
      <div class="flex items-center justify-between">
        <h3 v-if="title" class="text-lg font-semibold text-white">{{ title }}</h3>
        <ColumnConfig
          :selected-columns="selectedColumns"
          :all-columns="getAllColumns()"
          :default-columns="[
            'time',
            'ClientHost',
            'RequestMethod',
            'DownstreamStatus',
            'ServiceName',
            'RequestPath',
            'DownstreamContentSize',
            'Duration',
          ]"
          @columns-changed="handleColumnsChanged"
        />
      </div>
    </div>

    <div class="overflow-x-auto overflow-y-auto max-h-160 flex-1 px-6 pb-6">
      <table class="min-w-full table-auto">
        <thead>
          <tr class="border-b border-gray-600">
            <th
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
              @click="handleSort(column.key)"
            >
              <div class="flex items-center gap-1">
                {{ column.header }}
                <span v-if="getSortIcon(column.key)" class="text-blue-400">{{
                  getSortIcon(column.key)
                }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-600">
          <tr
            v-for="log in logs"
            :key="log.id"
            class="hover:bg-gray-700 transition-colors duration-150"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 text-sm text-gray-200"
              :class="column.cellClass"
            >
              <component
                :is="column.component"
                v-if="column.component"
                :log="log"
                :column="column"
              />
              <span v-else v-html="getColumnValue(log, column)"></span>
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
import ColumnConfig from './ColumnConfig.vue'
import { h, ref, computed, watch } from 'vue'

interface Column {
  key: string
  header: string
  cellClass?: string
  component?: any
  formatter?: (value: any) => string
}

interface Props {
  logs: LogEntry[]
  title?: string
  sortBy?: string[]
  sortDirection?: string[]
  getProperServiceName?: (serviceName: string | undefined) => string
  visibleColumns?: string[]
}

interface Emits {
  (e: 'sort', payload: { sortBy: string[]; sortDirection: string[] }): void
  (e: 'columns-changed', columns: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Log Entries',
  sortBy: () => ['time'],
  sortDirection: () => ['desc'],
  visibleColumns: () => [
    'time',
    'ClientHost',
    'RequestMethod',
    'DownstreamStatus',
    'ServiceName',
    'RequestPath',
    'DownstreamContentSize',
    'Duration',
  ],
})

const emit = defineEmits<Emits>()

const selectedColumns = ref([...props.visibleColumns])

watch(
  () => props.visibleColumns,
  (newColumns) => {
    selectedColumns.value = [...newColumns]
  },
  { immediate: true },
)

const handleColumnsChanged = (columns: string[]) => {
  selectedColumns.value = columns
  emit('columns-changed', columns)
}

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

const getMethodClass = (method: string, proto?: string): string => {
  const methodClasses: Record<string, string> = {
    GET: 'bg-green-900 text-green-200',
    POST: 'bg-blue-900 text-blue-200',
    PUT: 'bg-yellow-900 text-yellow-200',
    DELETE: 'bg-red-900 text-red-200',
    PATCH: 'bg-purple-900 text-purple-200',
    HEAD: 'bg-gray-700 text-gray-200',
    OPTIONS: 'bg-indigo-900 text-indigo-200',
  }

  if (proto?.toLowerCase() === 'websocket' || proto?.toLowerCase() === 'wss') {
    return 'bg-teal-900 text-teal-200'
  }

  return methodClasses[method?.toUpperCase()] || 'bg-gray-700 text-gray-200'
}

const formatIp = (ip: string): string => {
  if (!ip) return '-'
  return "<a href='https://ipinfo.io/" + ip + "' target='_blank'>" + ip + '</a>'
}

const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) {
    return 'bg-green-900 text-green-200'
  } else if (status >= 300 && status < 400) {
    return 'bg-yellow-900 text-yellow-200'
  } else if (status >= 400 && status < 500) {
    return 'bg-orange-900 text-orange-200'
  } else if (status >= 500) {
    return 'bg-red-900 text-red-200'
  }
  return 'bg-gray-700 text-gray-200'
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
  if (props.getProperServiceName) {
    return props.getProperServiceName(service)
  }

  return service || 'Invalid'
}

const MethodCell = (props: { log: LogEntry }) => {
  return h(
    'span',
    {
      class: [
        'px-2 py-1 text-xs font-medium rounded-full',
        getMethodClass(props.log.RequestMethod, props.log['request_X-Forwarded-Proto']),
      ],
    },
    (props.log['request_X-Forwarded-Proto'] || 'http').includes('http')
      ? props.log.RequestMethod
      : props.log['request_X-Forwarded-Proto']?.toUpperCase() || '-',
  )
}

const StatusCell = (props: { log: LogEntry }) => {
  return h(
    'span',
    {
      class: [
        'px-2 py-1 text-xs font-medium rounded-full',
        getStatusClass(props.log.DownstreamStatus),
      ],
    },
    props.log.DownstreamStatus?.toString() || '-',
  )
}

const ServiceCell = (props: { log: LogEntry }) => {
  return h(
    'span',
    {
      class: ['px-2 py-1 text-xs font-medium rounded-full', getServiceClass(props.log.ServiceName)],
    },
    getServiceName(props.log.ServiceName),
  )
}

const getAllColumns = (): Record<string, Column> => ({
  id: {
    key: 'id',
    header: 'ID',
    cellClass: 'text-gray-300 text-xs',
  },
  time: {
    key: 'time',
    header: 'Time',
    cellClass: 'text-white whitespace-nowrap',
    formatter: formatTime,
  },
  StartUTC: {
    key: 'StartUTC',
    header: 'Start UTC',
    cellClass: 'text-white whitespace-nowrap',
    formatter: formatTime,
  },
  ClientAddr: {
    key: 'ClientAddr',
    header: 'Client Address',
  },
  ClientHost: {
    key: 'ClientHost',
    header: 'Client Host',
    formatter: formatIp,
  },
  RequestMethod: {
    key: 'RequestMethod',
    header: 'Method',
    component: MethodCell,
  },
  DownstreamStatus: {
    key: 'DownstreamStatus',
    header: 'Status',
    component: StatusCell,
  },
  ServiceName: {
    key: 'ServiceName',
    header: 'Service',
    component: ServiceCell,
  },
  RequestPath: {
    key: 'RequestPath',
    header: 'Path',
    cellClass: 'max-w-xs truncate',
  },
  RequestProtocol: {
    key: 'RequestProtocol',
    header: 'Protocol',
  },
  DownstreamContentSize: {
    key: 'DownstreamContentSize',
    header: 'Size',
    cellClass: 'text-right',
    formatter: formatBytes,
  },
  Duration: {
    key: 'Duration',
    header: 'Duration',
    cellClass: 'text-right',
    formatter: formatDuration,
  },
  RetryAttempts: {
    key: 'RetryAttempts',
    header: 'Retries',
    cellClass: 'text-center',
  },
  TLSCipher: {
    key: 'TLSCipher',
    header: 'TLS Cipher',
    cellClass: 'text-xs',
  },
  TLSVersion: {
    key: 'TLSVersion',
    header: 'TLS Version',
    cellClass: 'text-xs',
  },
  'downstream_Content-Type': {
    key: 'downstream_Content-Type',
    header: 'Response Content-Type',
    cellClass: 'max-w-xs truncate text-xs',
  },
  'origin_Content-Type': {
    key: 'origin_Content-Type',
    header: 'Origin Content-Type',
    cellClass: 'max-w-xs truncate text-xs',
  },
  'request_User-Agent': {
    key: 'request_User-Agent',
    header: 'User Agent',
    cellClass: 'max-w-xs truncate text-xs',
  },
  'request_X-Forwarded-Proto': {
    key: 'request_X-Forwarded-Proto',
    header: 'X-Forwarded-Proto',
    cellClass: 'text-xs',
  },
  'request_X-Real-Ip': {
    key: 'request_X-Real-Ip',
    header: 'X-Real-IP',
    cellClass: 'text-xs',
  },
  level: {
    key: 'level',
    header: 'Log Level',
    cellClass: 'text-xs',
  },
  msg: {
    key: 'msg',
    header: 'Message',
    cellClass: 'max-w-xs truncate',
  },
})

const columns = computed(() => {
  const allColumns = getAllColumns()
  return selectedColumns.value.map((key: string) => allColumns[key]).filter(Boolean)
})

const getColumnValue = (log: LogEntry, column: Column): string => {
  const value = (log as any)[column.key]
  if (column.formatter) {
    return column.formatter(value)
  }
  return value || '-'
}

const handleSort = (field: string) => {
  const currentSortBy = [...props.sortBy]
  const currentDirection = [...props.sortDirection]

  const existingIndex = currentSortBy.indexOf(field)

  if (existingIndex !== -1) {
    if (currentDirection[existingIndex] === 'asc') {
      currentDirection[existingIndex] = 'desc'
    } else {
      currentSortBy.splice(existingIndex, 1)
      currentDirection.splice(existingIndex, 1)
    }
  } else {
    currentSortBy.unshift(field)
    currentDirection.unshift('asc')
  }

  emit('sort', { sortBy: currentSortBy, sortDirection: currentDirection })
}

const getSortIcon = (field: string): string => {
  const index = props.sortBy.indexOf(field)
  if (index === -1) return ''

  const direction = props.sortDirection[index]
  const priority = index === 0 ? '' : (index + 1).toString()

  return direction === 'asc' ? `↑${priority}` : `↓${priority}`
}
</script>
