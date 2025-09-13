<template>
  <div class="bg-gray-800 rounded-lg border border-gray-700 py-3 px-6 mb-6">
    <div
      class="flex items-center justify-between"
      :class="{ 'mb-4': hasActiveFilters || isExpanded }"
    >
      <h3 class="text-lg font-semibold text-white">Filters</h3>
      <div class="flex items-center gap-2">
        <button
          @click="clearAllFilters"
          v-if="hasActiveFilters"
          class="px-3 py-1 text-sm bg-gray-600 text-gray-300 rounded hover:bg-gray-500 transition-colors"
        >
          Clear All
        </button>
        <button
          @click="toggleExpanded"
          class="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
        >
          {{ isExpanded ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </div>

    <div v-if="isExpanded" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Client Host</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.ClientHost"
              @keyup.enter="addFilter('ClientHost')"
              placeholder="e.g. 192.168.1.1"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('ClientHost')"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div v-if="activeFilters.ClientHost.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.ClientHost"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('ClientHost', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude Client Host</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.not_ClientHost"
              @keyup.enter="addFilter('not_ClientHost')"
              placeholder="e.g. 192.168.1.1"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('not_ClientHost')"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div v-if="activeFilters.not_ClientHost.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.not_ClientHost"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('not_ClientHost', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Request Method</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.RequestMethod"
              @change="handleRequestMethodChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select method...</option>
              <option v-for="method in availableMethods" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
          </div>
          <div v-if="activeFilters.RequestMethod.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.RequestMethod"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('RequestMethod', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude Request Method</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.not_RequestMethod"
              @change="handleNotRequestMethodChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select method...</option>
              <option v-for="method in availableMethods" :key="method" :value="method">
                {{ method }}
              </option>
            </select>
          </div>
          <div v-if="activeFilters.not_RequestMethod.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.not_RequestMethod"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('not_RequestMethod', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Request Path</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.RequestPath"
              @keyup.enter="addFilter('RequestPath')"
              placeholder="e.g. /api/users"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('RequestPath')"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div v-if="activeFilters.RequestPath.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.RequestPath"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('RequestPath', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude Request Path</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.not_RequestPath"
              @keyup.enter="addFilter('not_RequestPath')"
              placeholder="e.g. /api/users"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('not_RequestPath')"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div v-if="activeFilters.not_RequestPath.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.not_RequestPath"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('not_RequestPath', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Status Code</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.DownstreamStatus"
              @change="handleDownstreamStatusChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select status code...</option>
              <option
                v-for="statusCode in availableStatusCodes"
                :key="statusCode"
                :value="statusCode"
              >
                {{ statusCode }} - {{ getStatusCodeDescription(statusCode) }}
              </option>
            </select>
          </div>
          <div v-if="activeFilters.DownstreamStatus.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.DownstreamStatus"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ value }}
              <button @click="removeFilter('DownstreamStatus', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude Status Code</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.not_DownstreamStatus"
              @change="handleNotDownstreamStatusChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select status code...</option>
              <option
                v-for="statusCode in availableStatusCodes"
                :key="statusCode"
                :value="statusCode"
              >
                {{ statusCode }} - {{ getStatusCodeDescription(statusCode) }}
              </option>
            </select>
          </div>
          <div
            v-if="activeFilters.not_DownstreamStatus.length > 0"
            class="flex flex-wrap gap-1 mt-2"
          >
            <span
              v-for="value in activeFilters.not_DownstreamStatus"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ value }}
              <button
                @click="removeFilter('not_DownstreamStatus', value)"
                class="hover:text-gray-300"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Service Name</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.ServiceName"
              @change="handleServiceNameChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select service...</option>
              <option value="Invalid">Invalid (null)</option>
              <option
                v-for="serviceName in availableServices"
                :key="serviceName"
                :value="serviceName"
              >
                {{ getDisplayServiceName(serviceName) }}
              </option>
            </select>
          </div>
          <div v-if="activeFilters.ServiceName.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.ServiceName"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ getDisplayServiceName(value) }}
              <button @click="removeFilter('ServiceName', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude Service Name</label>
          <div class="flex gap-2">
            <select
              v-model="tempFilters.not_ServiceName"
              @change="handleNotServiceNameChange"
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">Select service...</option>
              <option value="Invalid">Invalid (null)</option>
              <option
                v-for="serviceName in availableServices"
                :key="serviceName"
                :value="serviceName"
              >
                {{ getDisplayServiceName(serviceName) }}
              </option>
            </select>
          </div>
          <div v-if="activeFilters.not_ServiceName.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.not_ServiceName"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ getDisplayServiceName(value) }}
              <button @click="removeFilter('not_ServiceName', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">User Agent</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.requestUserAgent"
              @keyup.enter="addFilter('requestUserAgent')"
              placeholder="e.g. Mozilla/5.0..."
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('requestUserAgent')"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div v-if="activeFilters.requestUserAgent.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span
              v-for="value in activeFilters.requestUserAgent"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded"
            >
              {{ value.length > 50 ? value.substring(0, 50) + '...' : value }}
              <button @click="removeFilter('requestUserAgent', value)" class="hover:text-gray-300">
                ×
              </button>
            </span>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">Exclude User Agent</label>
          <div class="flex gap-2">
            <input
              v-model="tempFilters.not_requestUserAgent"
              @keyup.enter="addFilter('not_requestUserAgent')"
              placeholder="e.g. Mozilla/5.0..."
              class="flex-1 bg-gray-700 text-gray-300 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <button
              @click="addFilter('not_requestUserAgent')"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Add
            </button>
          </div>
          <div
            v-if="activeFilters.not_requestUserAgent.length > 0"
            class="flex flex-wrap gap-1 mt-2"
          >
            <span
              v-for="value in activeFilters.not_requestUserAgent"
              :key="value"
              class="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded"
            >
              {{ value.length > 50 ? value.substring(0, 50) + '...' : value }}
              <button
                @click="removeFilter('not_requestUserAgent', value)"
                class="hover:text-gray-300"
              >
                ×
              </button>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isExpanded && hasActiveFilters" class="mt-4">
      <div class="text-sm text-gray-400 mb-2">Active filters:</div>
      <div class="flex flex-wrap gap-1">
        <span
          v-for="filter in allActiveFilters"
          :key="`${filter.key}-${filter.value}`"
          :class="[
            'inline-flex items-center gap-1 px-2 py-1 text-xs rounded',
            filter.key.startsWith('not_') ? 'bg-red-600 text-white' : 'bg-blue-600 text-white',
          ]"
        >
          {{ getFilterLabel(filter.key) }}: {{ getDisplayFilterValue(filter.key, filter.value) }}
          <button @click="removeFilter(filter.key, filter.value)" class="hover:text-gray-300">
            ×
          </button>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import type { FilterValues, StatsApiResponse } from '../../../types/apiResponses'

interface Props {
  stats?: StatsApiResponse | null
  getProperServiceName?: (serviceName: string | undefined) => string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  filterChange: [filters: FilterValues]
}>()

const isExpanded = ref(false)

const activeFilters = reactive<FilterValues>({
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

const tempFilters = reactive({
  ClientHost: '',
  not_ClientHost: '',
  RequestMethod: '',
  not_RequestMethod: '',
  RequestPath: '',
  not_RequestPath: '',
  DownstreamStatus: '',
  not_DownstreamStatus: '',
  ServiceName: '',
  not_ServiceName: '',
  requestUserAgent: '',
  not_requestUserAgent: '',
})

const hasActiveFilters = computed(() => {
  return Object.values(activeFilters).some((filters) => filters.length > 0)
})

const allActiveFilters = computed(() => {
  const result: Array<{ key: keyof FilterValues; value: string }> = []
  Object.entries(activeFilters).forEach(([key, values]) => {
    values.forEach((value) => {
      result.push({ key: key as keyof FilterValues, value })
    })
  })
  return result
})

const availableServices = computed(() => {
  if (!props.stats) return []
  const services = props.stats.requestsByService
    .map((item) => item.ServiceName)
    .filter((name) => name !== null && name !== undefined)
    .sort()
  return [...new Set(services)]
})

const availableStatusCodes = computed(() => {
  if (!props.stats) return []
  const statusCodes = props.stats.requestsByStatus
    .map((item) => item.DownstreamStatus.toString())
    .sort((a, b) => parseInt(a) - parseInt(b))
  return [...new Set(statusCodes)]
})

const availableMethods = computed(() => {
  if (!props.stats) return []
  const methods = props.stats.requestsByMethod
    .map((item) => item.RequestMethod)
    .filter((method) => method !== null && method !== undefined)
    .sort()
  return [...new Set(methods)]
})

const getStatusCodeDescription = (code: string) => {
  const statusDescriptions: Record<string, string> = {
    '200': 'OK',
    '201': 'Created',
    '204': 'No Content',
    '301': 'Moved Permanently',
    '302': 'Found',
    '304': 'Not Modified',
    '400': 'Bad Request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not Found',
    '405': 'Method Not Allowed',
    '409': 'Conflict',
    '422': 'Unprocessable Entity',
    '429': 'Too Many Requests',
    '500': 'Internal Server Error',
    '502': 'Bad Gateway',
    '503': 'Service Unavailable',
    '504': 'Gateway Timeout',
  }
  return statusDescriptions[code] || 'Unknown'
}

const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value
}

const addFilter = (filterKey: keyof FilterValues) => {
  const value = tempFilters[filterKey].trim()
  if (value && !activeFilters[filterKey].includes(value)) {
    activeFilters[filterKey].push(value)
    tempFilters[filterKey] = ''
  }
}

const autoAddFilter = (filterKey: keyof FilterValues, value: string) => {
  if (value && !activeFilters[filterKey].includes(value)) {
    activeFilters[filterKey].push(value)
  }
}

const removeFilter = (filterKey: keyof FilterValues, value: string) => {
  const index = activeFilters[filterKey].indexOf(value)
  if (index > -1) {
    activeFilters[filterKey].splice(index, 1)
  }
}

const clearAllFilters = () => {
  Object.keys(activeFilters).forEach((key) => {
    activeFilters[key as keyof FilterValues] = []
  })
}

const getFilterLabel = (key: string): string => {
  const labels: Record<string, string> = {
    ClientHost: 'Host',
    not_ClientHost: '!Host',
    RequestMethod: 'Method',
    not_RequestMethod: '!Method',
    RequestPath: 'Path',
    not_RequestPath: '!Path',
    DownstreamStatus: 'Status',
    not_DownstreamStatus: '!Status',
    ServiceName: 'Service',
    not_ServiceName: '!Service',
    requestUserAgent: 'UA',
    not_requestUserAgent: '!UA',
  }
  return labels[key] || key
}

const handleRequestMethodChange = () => {
  autoAddFilter('RequestMethod', tempFilters.RequestMethod)
  tempFilters.RequestMethod = ''
}

const handleNotRequestMethodChange = () => {
  autoAddFilter('not_RequestMethod', tempFilters.not_RequestMethod)
  tempFilters.not_RequestMethod = ''
}

const handleDownstreamStatusChange = () => {
  autoAddFilter('DownstreamStatus', tempFilters.DownstreamStatus)
  tempFilters.DownstreamStatus = ''
}

const handleNotDownstreamStatusChange = () => {
  autoAddFilter('not_DownstreamStatus', tempFilters.not_DownstreamStatus)
  tempFilters.not_DownstreamStatus = ''
}

const handleServiceNameChange = () => {
  autoAddFilter('ServiceName', tempFilters.ServiceName)
  tempFilters.ServiceName = ''
}

const handleNotServiceNameChange = () => {
  autoAddFilter('not_ServiceName', tempFilters.not_ServiceName)
  tempFilters.not_ServiceName = ''
}

const getDisplayServiceName = (serviceName: string): string => {
  if (serviceName === 'Invalid') {
    return 'Invalid (null)'
  }

  if (props.getProperServiceName) {
    return props.getProperServiceName(serviceName)
  }

  return serviceName || 'Invalid'
}

const getDisplayFilterValue = (filterKey: string, value: string): string => {
  if (filterKey === 'ServiceName' || filterKey === 'not_ServiceName') {
    return getDisplayServiceName(value)
  }

  return value
}

watch(
  activeFilters,
  () => {
    const transformedFilters = { ...activeFilters } as any

    transformedFilters.ServiceName = transformedFilters.ServiceName.map((value: string) =>
      value === 'Invalid' ? null : value,
    )
    transformedFilters.not_ServiceName = transformedFilters.not_ServiceName.map((value: string) =>
      value === 'Invalid' ? null : value,
    )

    emit('filterChange', transformedFilters)
  },
  { deep: true },
)
</script>
