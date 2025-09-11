<template>
  <div
    class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:shadow-xl hover:border-gray-600 transition-all duration-200 flex flex-col h-80"
  >
    <h3 v-if="title" class="text-lg font-semibold text-white mb-4 flex-shrink-0">{{ title }}</h3>

    <div class="space-y-2 overflow-y-auto flex-1 min-h-0">
      <div
        v-for="item in itemsWithPercentages"
        :key="item.name"
        class="flex items-center justify-between"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between mb-1">
            <span
              class="text-sm font-medium text-gray-200 truncate mr-2 min-w-0 flex-1"
              :title="item.name"
              >{{ item.name }}</span
            >
            <div class="flex items-center space-x-2 flex-shrink-0">
              <span class="text-sm font-semibold text-white">{{ formatValue(item.value) }}</span>
              <span class="text-xs text-gray-400 whitespace-nowrap">({{ item.percentage }}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="items.length === 0" class="text-center py-4">
        <span class="text-gray-400 text-sm">No data available</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PercentageListItem } from '../../../types/apiResponses'

interface Props {
  items: PercentageListItem[]
  maximum?: number
  title?: string
  valueFormatter?: (value: number) => string
}

const props = withDefaults(defineProps<Props>(), {
  maximum: undefined,
  title: undefined,
  valueFormatter: (value: number) => value.toLocaleString(),
})

const calculatedMaximum = computed(() => {
  if (props.maximum !== undefined) {
    return props.maximum
  }

  if (props.items.length === 0) {
    return 1
  }

  return Math.max(...props.items.map((item) => item.value))
})

const itemsWithPercentages = computed(() => {
  const max = calculatedMaximum.value

  return props.items.map((item) => ({
    ...item,
    percentage: max > 0 ? Math.round((item.value / max) * 100) : 0,
  }))
})

const formatValue = (value: number): string => {
  return props.valueFormatter(value)
}
</script>
