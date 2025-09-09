<template>
  <div
    class="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200"
  >
    <div class="flex flex-col items-center text-center">
      <div class="text-3xl font-bold text-gray-800 mb-2">
        {{ value }}
        <span v-if="unit" class="text-lg font-medium text-gray-600 ml-1">{{ unit }}</span>
      </div>

      <p class="text-sm text-gray-600 font-medium">{{ description }}</p>
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
