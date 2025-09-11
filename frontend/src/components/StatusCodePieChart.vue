<template>
  <div
    class="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 flex flex-col h-122"
  >
    <h3 v-if="title" class="text-lg font-semibold text-gray-800 mb-4 flex-shrink-0">{{ title }}</h3>

    <div
      v-if="chartData && chartData.datasets[0].data.length > 0"
      class="relative flex flex-col flex-1 min-h-0"
    >
      <div class="w-full h-52 flex items-center justify-center flex-shrink-0">
        <Pie :data="chartData" :options="chartOptions" />
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2 overflow-y-auto flex-1">
        <div
          v-for="(item, index) in statusCodeItems"
          :key="item.statusCode"
          class="flex items-center space-x-2"
        >
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: colors[index % colors.length] }"
          ></div>
          <span class="text-sm text-gray-700">
            {{ item.statusCode }} ({{ item.count }})
            <span class="text-xs text-gray-500">({{ item.percentage }}%)</span>
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <span class="text-gray-500 text-sm">No status code data available</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  type ChartData,
  type ChartOptions,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, CategoryScale)

interface Props {
  statusCodes: { DownstreamStatus: number; count: number }[]
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'HTTP Status Codes',
})

const colors = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280']

const getStatusCodeColor = (statusCode: number): string => {
  if (statusCode >= 200 && statusCode < 300) return colors[0]
  if (statusCode >= 300 && statusCode < 400) return colors[1]
  if (statusCode >= 400 && statusCode < 500) return colors[2]
  if (statusCode >= 500 && statusCode < 600) return colors[3]
  return colors[4]
}

const statusCodeItems = computed(() => {
  const total = props.statusCodes.reduce((sum, item) => sum + item.count, 0)

  return props.statusCodes
    .map((item) => ({
      statusCode: item.DownstreamStatus,
      count: item.count,
      color: getStatusCodeColor(item.DownstreamStatus),
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
})

const chartData = computed<ChartData<'pie'>>(() => {
  if (!statusCodeItems.value.length) {
    return {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 0,
        },
      ],
    }
  }

  return {
    labels: statusCodeItems.value.map((item) => `${item.statusCode}`),
    datasets: [
      {
        data: statusCodeItems.value.map((item) => item.count),
        backgroundColor: statusCodeItems.value.map((item) => item.color),
        borderColor: statusCodeItems.value.map((item) => item.color),
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff',
      },
    ],
  }
})

const chartOptions = computed<ChartOptions<'pie'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || ''
          const value = context.parsed || 0
          const total = statusCodeItems.value.reduce((sum, item) => sum + item.count, 0)
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
          return `${label}: ${value} (${percentage}%)`
        },
      },
    },
  },
  animation: {
    animateRotate: true,
    animateScale: false,
  },
}))
</script>
