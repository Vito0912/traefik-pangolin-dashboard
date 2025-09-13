<template>
  <div>
    <button
      @click="showColumnConfig = !showColumnConfig"
      class="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
    >
      Columns
    </button>

    <div
      v-if="showColumnConfig"
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="showColumnConfig = false"
    >
      <div
        class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden border border-gray-700"
      >
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-white">Configure Columns</h3>
          <button
            @click="showColumnConfig = false"
            class="text-gray-400 hover:text-white transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div class="mb-4">
          <div class="space-y-2 max-h-168 overflow-y-auto pr-2">
            <div
              v-for="(columnKey, index) in visibleColumnKeys"
              :key="columnKey"
              class="flex items-center justify-between bg-gray-700 rounded p-3 cursor-move"
              draggable="true"
              @dragstart="handleDragStart($event, index)"
              @dragover.prevent
              @drop="handleDrop($event, index)"
            >
              <div class="flex items-center gap-3">
                <svg
                  class="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 8h16M4 16h16"
                  ></path>
                </svg>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    :checked="selectedColumns.includes(columnKey)"
                    @change="toggleColumn(columnKey)"
                    class="rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <span class="text-white">{{ allColumns[columnKey]?.header }}</span>
                </label>
              </div>
            </div>

            <div v-if="availableColumns.length > 0" class="pt-4 border-t border-gray-600">
              <p class="text-sm text-gray-400 mb-3">Available Columns:</p>
              <div class="space-y-2">
                <div
                  v-for="columnKey in availableColumns"
                  :key="columnKey"
                  class="flex items-center bg-gray-750 rounded p-3"
                >
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      :checked="false"
                      @change="toggleColumn(columnKey)"
                      class="rounded bg-gray-600 border-gray-500 text-blue-600 focus:ring-blue-500 focus:ring-2"
                    />
                    <span class="text-gray-300">{{ allColumns[columnKey]?.header }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3">
          <button
            @click="resetColumns"
            class="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Reset to Default
          </button>
          <button
            @click="showColumnConfig = false"
            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Column {
  key: string
  header: string
  cellClass?: string
  component?: any
  formatter?: (value: any) => string
}

interface Props {
  selectedColumns: string[]
  allColumns: Record<string, Column>
  defaultColumns?: string[]
}

interface Emits {
  (e: 'columns-changed', columns: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  defaultColumns: () => [
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

const showColumnConfig = ref(false)
const localSelectedColumns = ref([...props.selectedColumns])
const draggedIndex = ref<number | null>(null)

watch(
  () => props.selectedColumns,
  (newColumns) => {
    localSelectedColumns.value = [...newColumns]
  },
  { immediate: true },
)

const visibleColumnKeys = computed(() => localSelectedColumns.value)

const availableColumns = computed(() => {
  const allKeys = Object.keys(props.allColumns)
  return allKeys.filter((key) => !localSelectedColumns.value.includes(key))
})

const toggleColumn = (columnKey: string) => {
  const index = localSelectedColumns.value.indexOf(columnKey)
  if (index === -1) {
    localSelectedColumns.value.push(columnKey)
  } else {
    localSelectedColumns.value.splice(index, 1)
  }
  emit('columns-changed', localSelectedColumns.value)
}

const resetColumns = () => {
  localSelectedColumns.value = [...props.defaultColumns]
  emit('columns-changed', localSelectedColumns.value)
}

const handleDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', (event.target as HTMLElement).outerHTML)
  }
}

const handleDrop = (event: DragEvent, dropIndex: number) => {
  event.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== dropIndex) {
    const item = localSelectedColumns.value.splice(draggedIndex.value, 1)[0]
    localSelectedColumns.value.splice(dropIndex, 0, item)
    emit('columns-changed', localSelectedColumns.value)
  }
  draggedIndex.value = null
}
</script>
