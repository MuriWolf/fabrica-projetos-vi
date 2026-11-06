<template>
  <div class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Movimentações de Estoque</h1>
        <p class="text-gray-500">Registre entradas e saídas dos lotes</p>
      </div>

      <UButton
        color="primary"
        icon="i-lucide-plus"
        class="cursor-pointer"
        @click="openCreateModal"
      >
        Nova Movimentação
      </UButton>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <UCard class="bg-green-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-arrow-down-left" class="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total de Entradas</p>
          <p class="text-2xl font-bold">{{ entryTotal }}</p>
        </div>
      </div>
    </UCard>

    <UCard class="bg-orange-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-arrow-up-right" class="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Total de Saídas</p>
          <p class="text-2xl font-bold">{{ exitTotal }}</p>
        </div>
      </div>
    </UCard>

    <UCard class="bg-purple-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-history" class="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Movimentações</p>
          <p class="text-2xl font-bold">{{ movements.length }}</p>
        </div>
      </div>
    </UCard>
  </div>

  <UCard class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row">
      <UInput
        v-model="filters.search"
        placeholder="Buscar por medicamento ou lote..."
        icon="i-lucide-search"
        clearable
        class="flex-1"
        aria-label="Buscar movimentação"
        @clear="filters.search = ''"
      />

      <USelect
        v-model="filters.type"
        :items="filterTypeOptions"
        class="sm:max-w-52"
        aria-label="Filtrar por tipo de movimentação"
      />

      <UButton
        color="warning"
        class="cursor-pointer sm:max-w-40"
        :disabled="!isAnyFilterApplied"
        @click="resetFilters"
      >
        Limpar filtros
      </UButton>
    </div>
  </UCard>

  <UCard>
    <UAlert
      v-if="stockError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="stockError"
      class="mb-4"
    />

    <div v-if="loading" class="py-2">
      <TableSkeleton :rows="6" :columns="4" />
    </div>

    <div v-else-if="filteredRows.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-history" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Nenhuma movimentação encontrada</p>
      <p class="text-sm text-gray-400 mt-1">
        Registre uma entrada ou saída para começar.
      </p>
    </div>

    <UTable
      v-else
      :data="paginatedRows"
      :columns="columns"
      caption="Lista de movimentações de estoque"
      class="h-[calc(100vh-512px)]"
    >
      <template #medicineName-cell="{ row }">
        <div>
          <p class="font-medium text-gray-900">{{ row.original.medicineName }}</p>
          <p class="text-sm text-gray-500">{{ row.original.batchNumber }}</p>
        </div>
      </template>

      <template #type-cell="{ row }">
        <UBadge
          :label="row.original.type === 'Entry' ? 'Entrada' : 'Saída'"
          :color="row.original.type === 'Entry' ? 'success' : 'warning'"
          variant="subtle"
        />
      </template>

      <template #quantity-cell="{ row }">
        <span
          class="font-semibold"
          :class="row.original.type === 'Entry' ? 'text-green-600' : 'text-orange-600'"
        >
          {{ row.original.type === 'Entry' ? '+' : '-' }}{{ row.original.quantity }}
        </span>
      </template>

      <template #occurredAt-cell="{ row }">
        {{ formatDateTime(row.original.occurredAt) }}
      </template>
    </UTable>

    <div
      v-if="filteredRows.length > 0"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-100"
    >
      <p class="text-sm text-gray-500">
        Mostrando {{ from }} a {{ to }} de {{ filteredRows.length }}
        {{ filteredRows.length === 1 ? 'movimentação' : 'movimentações' }}
      </p>
      <UPagination
        v-model:page="page"
        :total="filteredRows.length"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
      />
    </div>
  </UCard>

  <UModal
    v-if="showFormModal"
    v-model:open="showFormModal"
    title="Nova Movimentação"
  >
    <template #body>
      <UForm
        :schema="movementSchema"
        :state="formData"
        class="space-y-4"
        @submit="handleSave"
      >
        <UFormField name="batchId" label="Lote" required>
          <USelect
            v-model="formData.batchId"
            :items="batchOptions"
            placeholder="Selecione um lote"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <div
          v-if="selectedBatch"
          class="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-600"
        >
          Estoque atual:
          <strong class="text-gray-900">{{ selectedBatch.quantity }}</strong>
          unidades
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField name="type" label="Tipo" required>
            <USelect
              v-model="formData.type"
              :items="typeOptions"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>

          <UFormField name="quantity" label="Quantidade" required>
            <UInput
              v-model.number="formData.quantity"
              type="number"
              min="1"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>
        </div>

        <UFormField name="occurredAt" label="Data da Movimentação" required>
          <UInput
            v-model="formData.occurredAt"
            type="date"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UAlert
          v-if="formData.type === 'Exit' && selectedBatch && formData.quantity > selectedBatch.quantity"
          color="warning"
          variant="soft"
          icon="i-lucide-info"
          title="Quantidade maior que o estoque disponível"
          description="A saída não pode deixar o lote com quantidade negativa."
        />

        <div class="flex flex-col-reverse gap-3 w-full sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :disabled="saving"
            @click="closeFormModal"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            class="cursor-pointer"
            :loading="saving"
          >
            Registrar
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useStock, type StockMovement } from '~/composables/useStock'
import { usePagination } from '~/composables/usePagination'
import {
  movementSchema,
  type MovementFormData
} from '~/composables/useMovementSchema'

definePageMeta({
  layout: 'protected'
})

interface MovementRow {
  id: string
  medicineName: string
  batchNumber: string
  type: 'Entry' | 'Exit'
  quantity: number
  occurredAt: string
}

const toast = useToast()
const stock = useStock()

const {
  loading,
  error: stockError,
  medicines,
  batches,
  movements,
  loadAll,
  createMovement,
  getBatchWithMedicine
} = stock

const typeOptions = [
  { label: 'Entrada', value: 'Entry' },
  { label: 'Saída', value: 'Exit' }
]

const filterTypeOptions = [
  { label: 'Todos os tipos', value: 'all' },
  ...typeOptions
]

const columns: TableColumn<MovementRow>[] = [
  { accessorKey: 'medicineName', header: 'Medicamento / Lote', enableSorting: true },
  { accessorKey: 'type', header: 'Tipo', enableSorting: true },
  { accessorKey: 'quantity', header: 'Quantidade', enableSorting: true },
  { accessorKey: 'occurredAt', header: 'Data', enableSorting: true }
]

const filters = ref({
  search: '',
  type: 'all'
})

const showFormModal = ref(false)
const saving = ref(false)

const formData = reactive<MovementFormData>({
  batchId: '',
  type: 'Entry',
  quantity: 1,
  occurredAt: todayInput()
})

const selectedBatch = computed(
  () => batches.value.find(batch => batch.id === formData.batchId) || null
)

const batchOptions = computed(() =>
  batches.value.map(batch => {
    const enriched = getBatchWithMedicine(batch.id)
    const medicineName = enriched?.medicineName || 'Medicamento'
    return {
      label: `${medicineName} · ${batch.batchNumber} (${batch.quantity} un.)`,
      value: batch.id
    }
  })
)

const isAnyFilterApplied = computed(
  () => filters.value.search !== '' || filters.value.type !== 'all'
)

const rows = computed<MovementRow[]>(() => {
  return movements.value
    .map(movement => {
      const enriched = getBatchWithMedicine(movement.batchId)
      const medicine =
        medicines.value.find(item => item.id === movement.medicineId) || null

      return {
        id: movement.id,
        medicineName: enriched?.medicineName || medicine?.name || 'Desconhecido',
        batchNumber: enriched?.batchNumber || movement.batchId,
        type: movement.type,
        quantity: movement.quantity,
        occurredAt: movement.occurredAt
      }
    })
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
})

const filteredRows = computed(() => {
  let result = rows.value

  if (filters.value.type !== 'all') {
    result = result.filter(row => row.type === filters.value.type)
  }

  const term = filters.value.search.trim().toLowerCase()
  if (term) {
    result = result.filter(
      row =>
        row.medicineName.toLowerCase().includes(term) ||
        row.batchNumber.toLowerCase().includes(term)
    )
  }

  return result
})

const { page, pageSize, from, to, paginated: paginatedRows } =
  usePagination(filteredRows)

watch(filters, () => {
  page.value = 1
}, { deep: true })

const entryTotal = computed(() =>
  movements.value
    .filter(movement => movement.type === 'Entry')
    .reduce((sum, movement) => sum + movement.quantity, 0)
)

const exitTotal = computed(() =>
  movements.value
    .filter(movement => movement.type === 'Exit')
    .reduce((sum, movement) => sum + movement.quantity, 0)
)

function todayInput(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10)
}

function formatDateTime(value: string): string {
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function resetFilters() {
  filters.value = {
    search: '',
    type: 'all'
  }
}

function openCreateModal() {
  formData.batchId = ''
  formData.type = 'Entry'
  formData.quantity = 1
  formData.occurredAt = todayInput()
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
}

async function loadMovements() {
  try {
    await loadAll()
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar as movimentações.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

async function handleSave(event: { data: MovementFormData }) {
  const batch = selectedBatch.value

  if (!batch) {
    toast.add({
      title: 'Erro',
      description: 'Selecione um lote válido.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  if (!batch.stockId) {
    toast.add({
      title: 'Erro',
      description: 'Este lote não possui um estoque associado.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  if (event.data.type === 'Exit' && event.data.quantity > batch.quantity) {
    toast.add({
      title: 'Quantidade inválida',
      description: 'A saída não pode ser maior que o estoque atual do lote.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
    return
  }

  saving.value = true

  try {
    const movement: Omit<StockMovement, 'id'> = {
      stockId: batch.stockId,
      batchId: batch.id,
      medicineId: batch.medicineId,
      type: event.data.type,
      quantity: event.data.quantity,
      occurredAt: new Date(`${event.data.occurredAt}T12:00:00`).toISOString(),
      transferId: null
    }

    await createMovement(movement)

    toast.add({
      title: 'Sucesso!',
      description:
        event.data.type === 'Entry'
          ? 'Entrada registrada com sucesso.'
          : 'Saída registrada com sucesso.',
      icon: 'i-lucide-check',
      color: 'primary'
    })

    await loadMovements()
    closeFormModal()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível registrar a movimentação.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadMovements()
})
</script>
