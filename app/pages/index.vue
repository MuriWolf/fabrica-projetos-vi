<template>
  <div class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Gerenciamento de Estoque</h1>
        <p class="text-gray-500">Visualize e gerencie os medicamentos</p>
      </div>

      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-lucide-plus"
        class="w-full sm:w-auto"
        @click="openCreateModal"
      >
        Novo Lote
      </UButton>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
    <NuxtLink
      to="/medicines"
      class="block rounded-xl focus-visible:outline-3 focus-visible:outline-primary/25"
      aria-label="Ir para a tela de medicamentos"
    >
      <UCard class="bg-purple-50/50 h-full transition-shadow hover:shadow-md cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-purple-100 border border-purple-200 flex items-center justify-center">
            <UIcon name="i-lucide-pill" class="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Medicamentos</p>
            <p class="text-2xl font-bold">{{ medicines.length }}</p>
          </div>
        </div>
      </UCard>
    </NuxtLink>

    <button
      type="button"
      class="text-left w-full rounded-xl focus-visible:outline-3 focus-visible:outline-primary/25"
      aria-label="Filtrar lotes ativos"
      @click="applyStatusFilter('available')"
    >
      <UCard class="bg-green-50/50 h-full transition-shadow hover:shadow-md cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center">
            <UIcon name="i-lucide-package" class="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Lotes Ativos</p>
            <p class="text-2xl font-bold">{{ activeBatches }}</p>
          </div>
        </div>
      </UCard>
    </button>

    <button
      type="button"
      class="text-left w-full rounded-xl focus-visible:outline-3 focus-visible:outline-primary/25"
      aria-label="Filtrar lotes vencendo em breve"
      @click="applyStatusFilter('expiring_soon')"
    >
      <UCard class="bg-yellow-50/50 h-full transition-shadow hover:shadow-md cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-yellow-100 border border-orange-200 flex items-center justify-center">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Vencendo</p>
            <p class="text-2xl font-bold">{{ expiringCount }}</p>
          </div>
        </div>
      </UCard>
    </button>

    <button
      type="button"
      class="text-left w-full rounded-xl focus-visible:outline-3 focus-visible:outline-primary/25"
      aria-label="Filtrar lotes com estoque baixo ou crítico"
      @click="applyStatusFilter('low_stock_group')"
    >
      <UCard class="bg-red-50/50 h-full transition-shadow hover:shadow-md cursor-pointer">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
            <UIcon name="i-lucide-trending-down" class="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p class="text-sm text-gray-500">Estoque Baixo</p>
            <p class="text-2xl font-bold">{{ lowStockCount }}</p>
          </div>
        </div>
      </UCard>
    </button>
  </div>

  <UCard class="mb-6">
    <div class="flex flex-col gap-4 md:flex-row md:items-center">
      <UInput
        v-model="filters.search"
        placeholder="Buscar medicamento..."
        icon="i-lucide-search"
        clearable
        class="flex-1"
        aria-label="Buscar lote por medicamento"
        @clear="filters.search = ''"
      />

      <USelect
        v-model="filters.medicalId"
        :items="medicines.map(m => ({ label: m.name, value: m.id }))"
        placeholder="Filtrar por medicamento"
        class="flex-1"
        aria-label="Filtrar por medicamento"
      />

      <USelect
        v-model="filters.status"
        :items="[
          { label: 'Todos', value: 'todos' },
          { label: 'Disponível', value: 'available' },
          { label: 'Estoque Baixo', value: 'low_stock' },
          { label: 'Baixo ou Crítico', value: 'low_stock_group' },
          { label: 'Vencendo', value: 'expiring_soon' },
          { label: 'Crítico', value: 'critical' }
        ]"
        class="flex-1 md:max-w-52"
        placeholder="Status"
        aria-label="Filtrar por status do lote"
      />

      <UButton
        color="warning"
        class="md:max-w-40"
        :disabled="!isAnyFilterApplied"
        @click="resetFilters"
      >
        Limpar filtros
      </UButton>
    </div>
  </UCard>

  <UCard class="lg:h-[calc(100vh-410px)]">
    <UAlert
      v-if="stockError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      :title="stockError"
      class="mb-4"
    />

    <div v-if="stock.loading.value" class="py-2">
      <TableSkeleton :rows="6" :columns="isAdmin ? 6 : 5" />
    </div>

    <div v-else-if="filteredBatches.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-inbox" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Nenhum lote encontrado</p>
    </div>

    <UTable
      v-else
      :data="tableRows"
      :columns="columns"
      caption="Lista de lotes em estoque"
      class="h-80 lg:h-[calc(100vh-516px)]"
    >
      <template #medicineName-cell="{ row }">
        <div>
          <p class="font-medium">{{ row.original.medicineName }}</p>
          <p class="text-sm text-gray-500">{{ row.original.medicineDosage }}</p>
        </div>
      </template>

      <template #status-cell="{ row }">
        <UBadge
          :label="getStatusLabel(row.original.status)"
          :color="getColorFromStatus(row.original.status)"
          variant="subtle"
        />
      </template>

      <template #expirationDate-cell="{ row }">
        <span :class="isExpiringSoon(row.original.expirationDate) ? 'text-orange-600 font-medium' : 'text-gray-700'">
          {{ formatDate(row.original.expirationDate) }}
        </span>
      </template>

      <template #actions-cell="{ row }">
        <div v-if="isAdmin" class="flex items-center gap-2">
          <UButton
            color="primary"
            variant="soft"
            size="xs"
            icon="i-lucide-edit-2"
            class="cursor-pointer"
            aria-label="Editar lote"
            title="Editar lote"
            @click="openEditModal(row.original)"
          />
          <UButton
            color="error"
            variant="soft"
            size="xs"
            icon="i-lucide-trash-2"
            class="cursor-pointer"
            aria-label="Excluir lote"
            title="Excluir lote"
            @click="confirmDelete(row.original)"
          />
        </div>
      </template>
    </UTable> 

    <div v-if="filteredBatches.length > 0" class="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
      <p class="text-sm text-gray-500">
        Mostrando {{ pagination.from }} a {{ pagination.to }} de {{ filteredBatches.length }} lotes
      </p>
      <UPagination
        v-model:page="pagination.page"
        :total="filteredBatches.length"
        :items-per-page="pagination.pageSize"
        :sibling-count="1"
        show-edges
      />
    </div>
  </UCard>

  <div class="grid grid-cols-1 gap-4 mt-6 lg:grid-cols-2">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold text-gray-900">Movimentações Recentes</h2>
          <NuxtLink
            to="/movements"
            class="text-sm font-medium text-primary-600 hover:underline"
          >
            Ver todas
          </NuxtLink>
        </div>
      </template>

      <div
        v-if="recentMovements.length === 0"
        class="py-6 text-center text-sm text-gray-500"
      >
        Nenhuma movimentação registrada.
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="movement in recentMovements"
          :key="movement.id"
          class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium text-gray-900 truncate">
              {{ movement.medicineName }}
            </p>
            <p class="text-sm text-gray-500">
              {{ movement.batchNumber }} · {{ formatDateTime(movement.occurredAt) }}
            </p>
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <UBadge
              :label="movement.type === 'Entry' ? 'Entrada' : 'Saída'"
              :color="movement.type === 'Entry' ? 'success' : 'warning'"
              variant="subtle"
            />
            <span
              class="text-sm font-semibold"
              :class="movement.type === 'Entry' ? 'text-green-600' : 'text-orange-600'"
            >
              {{ movement.type === 'Entry' ? '+' : '-' }}{{ movement.quantity }}
            </span>
          </div>
        </li>
      </ul>
    </UCard>

    <UCard>
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <h2 class="font-semibold text-gray-900">Alertas de Validade</h2>
          <NuxtLink
            to="/alerts"
            class="text-sm font-medium text-primary-600 hover:underline"
          >
            Ver todos
          </NuxtLink>
        </div>
      </template>

      <div
        v-if="dashboardAlerts.length === 0"
        class="py-6 text-center text-sm text-gray-500"
      >
        Nenhum alerta pendente.
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="alert in dashboardAlerts"
          :key="alert.id"
          class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="min-w-0">
            <p class="font-medium text-gray-900 truncate">
              {{ alert.medicineName }}
            </p>
            <p class="text-sm text-gray-500">
              Lote {{ alert.lotNumber }} · {{ alert.quantity }} un.
            </p>
          </div>

          <UBadge
            :label="alert.daysLabel"
            :color="alert.daysColor"
            variant="subtle"
            class="flex-shrink-0"
          />
        </li>
      </ul>
    </UCard>
  </div>

  <UModal v-if="showModal" v-model:open="showModal" :title="editingBatch ? 'Editar Lote' : 'Novo Lote'">
    <template #body>
      <UForm
        :schema="batchSchema"
        :state="formData"
        @submit="handleSave"
        class="space-y-4"
      >
        <UFormField name="medicineId" label="Medicamento" required>
          <USelect
            v-model="formData.medicineId"
            :items="medicines.map(m => ({ label: m.name, value: m.id }))"
            placeholder="Selecione um medicamento"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField name="batchNumber" label="Número do Lote" required>
          <UInput
            v-model="formData.batchNumber"
            placeholder="LOT2026A001"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField name="fabricationDate" label="Data de Fabricação" required>
          <UInput
            v-model="formData.fabricationDate"
            type="date"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField name="expirationDate" label="Data de Vencimento" required>
          <UInput
            v-model="formData.expirationDate"
            type="date"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField name="quantity" label="Quantidade" required>
          <UInput
            v-model.number="formData.quantity"
            type="number"
            placeholder="0"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <div class="flex flex-col-reverse gap-3 w-full sm:flex-row sm:justify-end">
          <UButton
            color="neutral"
            variant="ghost"
            class="cursor-pointer"
            :disabled="saving"
            @click="closeModal"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            class="cursor-pointer"
            :loading="saving"
          >
            {{ editingBatch ? 'Atualizar' : 'Criar' }}
          </UButton>
        </div>
      </UForm> 
    </template>
  </UModal>

  <UModal v-if="showDeleteModal" v-model:open="showDeleteModal" :prevent-close="true" title="Excluir Lote?">
    <template #body>
      <!-- <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-error-500" /> -->

      <p class="text-gray-500 mb-4">
        Esta ação não pode ser desfeita. Todos os dados deste lote serão permanentemente removidos.
      </p>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="showDeleteModal = false"
        >
          Cancelar
        </UButton>
        <UButton
          color="error"
          :loading="deleting"
          class="cursor-pointer"
          @click="handleDelete"
        >
          Excluir
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useStock } from '~/composables/useStock'

import type { TableColumn } from '@nuxt/ui'

interface BatchRow {
  id: string
  medicineId: string
  medicineName: string
  medicineDosage: string
  batchNumber: string
  quantity: number
  status?: string
  fabricationDate: string
  expirationDate: string
}

type DashboardBadgeColor = 'error' | 'warning' | 'success' | 'neutral'

interface DashboardMovement {
  id: string
  medicineName: string
  batchNumber: string
  type: 'Entry' | 'Exit'
  quantity: number
  occurredAt: string
}

interface DashboardAlert {
  id: string
  medicineName: string
  lotNumber: string
  quantity: number
  days: number | null
  daysLabel: string
  daysColor: DashboardBadgeColor
}

const columns: ComputedRef<TableColumn<BatchRow>[]> = computed(() => {
  const fields: any[] = [
    { accessorKey: 'medicineName', header: 'Medicamento', enableSorting: true },
    { accessorKey: 'batchNumber', header: 'Lote', enableSorting: true },
    { accessorKey: 'quantity', header: 'Quantidade', enableSorting: true },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'expirationDate', header: 'Vencimento', enableSorting: true },
  ]
  if (isAdmin.value) {
    fields.push({ id: 'actions', header: 'Ações', meta: { class: { th: 'w-20', td: 'w-20' } } })
  }

  return fields
})

const tableRows = computed<BatchRow[]>(() =>
  paginatedBatches.value.map(batch => {
    const enriched = getBatchWithMedicine(batch.id)
    return {
      id: batch.id,
      medicineId: batch.medicineId,
      medicineName: enriched?.medicineName ?? 'Desconhecido',
      medicineDosage: enriched?.medicineDosage ?? '',
      batchNumber: batch.batchNumber,
      quantity: batch.quantity ?? 0,
      status: batch.status,
      fabricationDate: batch.fabricationDate,
      expirationDate: batch.expirationDate
    }
  })
)

definePageMeta({
  layout: 'protected'
})

const toast = useToast()
const auth = useAuth()
const stock = useStock()

const { isAdmin } = auth

const {
  loading,
  error: stockError,
  medicines,
  batches,
  movements,
  alerts,
  healthUnits,
  loadAll,
  createBatch,
  updateBatch,
  deleteBatch,
  getBatchWithMedicine
} = stock

const filters = ref({
  search: '',
  medicalId: '',
  status: 'todos'
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  get from() {
    return (this.page - 1) * this.pageSize + 1
  },
  get to() {
    return Math.min(this.page * this.pageSize, filteredBatches.value.length)
  },
  get pageCount() {
    return Math.ceil(filteredBatches.value.length / this.pageSize) || 1
  }
})

const showModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingBatch = ref<any>(null)

const formData = ref({
  medicineId: '',
  batchNumber: '',
  fabricationDate: '',
  expirationDate: '',
  quantity: 0
})

const selectedBatch = ref<any>(null)

const isAnyFilterApplied = computed(() => {
  return (
    filters.value.search != '' || 
    filters.value.medicalId != '' ||
    filters.value.status != 'todos'
  ) 
});

const filteredBatches = computed(() => {
  let result = [...batches.value]

  if (filters.value.medicalId) {
    result = result.filter(b => b.medicineId === filters.value.medicalId)
  }

  if (filters.value.status === 'low_stock_group') {
    result = result.filter(
      b => b.status === 'low_stock' || b.status === 'critical'
    )
  } else if (filters.value.status !== 'todos') {
    result = result.filter(b => b.status === filters.value.status)
  }

  if (filters.value.search) {
    const searchLower = filters.value.search.toLowerCase()
    result = result.filter(batch => {
      const enriched = getBatchWithMedicine(batch.id)
      return enriched?.medicineName.toLowerCase().includes(searchLower)
    })
  }

  return result
})

const paginatedBatches = computed(() => {
  const start = (pagination.value.page - 1) * pagination.value.pageSize
  const end = start + pagination.value.pageSize
  return filteredBatches.value.slice(start, end)
})

const activeBatches = computed(() => 
  batches.value.filter(b => b.status === 'available').length
)

const expiringCount = computed(() => 
  batches.value.filter(b => b.status === 'expiring_soon').length
)

const lowStockCount = computed(() => 
  batches.value.filter(b => b.status === 'low_stock' || b.status === 'critical').length
)

const recentMovements = computed<DashboardMovement[]>(() => {
  return [...movements.value]
    .sort(
      (a, b) =>
        new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
    )
    .slice(0, 5)
    .map(movement => {
      const enriched = getBatchWithMedicine(movement.batchId)
      const medicine = medicines.value.find(
        item => item.id === movement.medicineId
      )

      return {
        id: movement.id,
        medicineName:
          enriched?.medicineName || medicine?.name || 'Desconhecido',
        batchNumber: enriched?.batchNumber || movement.batchId,
        type: movement.type,
        quantity: movement.quantity,
        occurredAt: movement.occurredAt
      }
    })
})

const dashboardAlerts = computed<DashboardAlert[]>(() => {
  return alerts.value
    .filter(alert => !alert.resolved)
    .map(alert => {
      const batch = batches.value.find(item => item.id === alert.batchId)
      const enriched = batch ? getBatchWithMedicine(batch.id) : null
      const days = getDaysUntilExpiry(alert.expiryDate || alert.alertDate)

      return {
        id: alert.id,
        medicineName:
          alert.medicineName || enriched?.medicineName || 'Desconhecido',
        lotNumber: alert.lotNumber || batch?.batchNumber || '—',
        quantity: alert.quantity ?? batch?.quantity ?? 0,
        days,
        daysLabel: daysLabel(days),
        daysColor: daysColor(days)
      }
    })
    .sort((a, b) => (a.days ?? 9999) - (b.days ?? 9999))
    .slice(0, 5)
})

function getStatusLabel(status?: string) {
  const labels: Record<string, string> = {
    available: 'Disponível',
    low_stock: 'Estoque Baixo',
    expiring_soon: 'Vencendo em Breve',
    critical: 'Crítico'
  }
  return labels[status || 'available'] || 'Disponível'
}

function getColorFromStatus(status?: string) {
  const colors: Record<string, any> = {
    available: 'success',
    low_stock: 'warning',
    expiring_soon: 'warning',
    critical: 'error'
  }
  return colors[status || 'available'] || 'success'
}

function isExpiringSoon(expirationDate: string) {
  const expDate = new Date(expirationDate)
  const today = new Date()
  const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  return diffDays <= 30
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatDateTime(value: string) {
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

function getDaysUntilExpiry(value?: string): number | null {
  if (!value) return null

  const target = new Date(value.includes('T') ? value : `${value}T12:00:00`)
  if (Number.isNaN(target.getTime())) return null

  const today = new Date()
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function daysLabel(days: number | null) {
  if (days === null) return '—'
  if (days < 0) return 'Vencido'
  if (days === 0) return 'Vence hoje'
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

function daysColor(days: number | null): DashboardBadgeColor {
  if (days === null) return 'neutral'
  if (days <= 7) return 'error'
  if (days <= 30) return 'warning'
  return 'success'
}

async function loadStock() {
  try {
    await loadAll()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar o estoque.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

function resetForm() {
  editingBatch.value = null
  Object.assign(formData, {
    medicineId: '',
    batchNumber: '',
    fabricationDate: '',
    expirationDate: '',
    quantity: 0
  })
}

function resetFilters() {
  filters.value = {
    search: '',
    medicalId: '',
    status: 'todos'
  }
  pagination.value.page = 1
}

function applyStatusFilter(status: string) {
  filters.value.status = status
  pagination.value.page = 1
}

function openCreateModal() {
  editingBatch.value = null
  formData.value = {
    medicineId: '',
    batchNumber: '',
    fabricationDate: '',
    expirationDate: '',
    quantity: 0
  }
  showModal.value = true
}

function openEditModal(batch: any) {
  editingBatch.value = batch
  formData.value = {
    medicineId: batch.medicineId,
    batchNumber: batch.batchNumber,
    fabricationDate: batch.fabricationDate,
    expirationDate: batch.expirationDate,
    quantity: batch.quantity || 0
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingBatch.value = null
}

async function handleSave(event: any) {
  const validatedData = event.data
  
  saving.value = true
  try {
    if (editingBatch.value) {
      await updateBatch(editingBatch.value.id, validatedData)
      toast.add({
        title: 'Sucesso!',
        description: 'Lote atualizado com sucesso.',
        icon: 'i-lucide-check',
        color: 'primary'
      })
    } else {
      await createBatch(validatedData)
      toast.add({
        title: 'Sucesso!',
        description: 'Lote criado com sucesso.',
        icon: 'i-lucide-check',
        color: 'primary'
      })
    }

    await loadStock()
    closeModal()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível salvar o lote.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(batch: any) {
  selectedBatch.value = batch
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedBatch.value) return

  deleting.value = true
  try {
    await deleteBatch(selectedBatch.value.id)
    toast.add({
      title: 'Sucesso!',
      description: 'Lote excluído com sucesso.',
      icon: 'i-lucide-check',
      color: 'primary'
    })
    showDeleteModal.value = false
    await loadStock()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível excluir o lote.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    deleting.value = false
    selectedBatch.value = null
  }
}

onMounted(async () => {
  await loadStock()
})

watch(() => filters.value, () => {
  pagination.value.page = 1
}, { deep: true })
</script>