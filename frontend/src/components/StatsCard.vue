<template>
  <div
    class="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700 hover:shadow-xl hover:border-gray-600 transition-all duration-200"
  >
    <div class="flex flex-col items-center text-center">
      <div class="text-3xl font-bold text-white mb-2">
        {{ value }}
        <span v-if="unit" class="text-lg font-medium text-gray-300 ml-1">{{ unit }}</span>
      </div>

      <p class="text-sm text-gray-300 font-medium">{{ description }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  value: string | number
  unit?: string
  description: string
}

defineProps<Props>()
</script>
