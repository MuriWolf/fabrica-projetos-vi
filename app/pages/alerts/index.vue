<template>
  <div class="mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Alertas de Validade</h1>
      <p class="text-gray-500">
        Acompanhe lotes próximos do vencimento e resolva os alertas
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <UCard class="bg-yellow-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-yellow-100 border border-yellow-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-clock" class="w-5 h-5 text-yellow-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Pendentes</p>
          <p class="text-2xl font-bold">{{ pendingCount }}</p>
        </div>
      </div>
    </UCard>

    <UCard class="bg-red-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Alta Prioridade</p>
          <p class="text-2xl font-bold">{{ highPriorityCount }}</p>
        </div>
      </div>
    </UCard>

    <UCard class="bg-green-50/50">
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-lg bg-green-100 border border-green-200 flex items-center justify-center"
        >
          <UIcon name="i-lucide-check-circle" class="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p class="text-sm text-gray-500">Resolvidos</p>
          <p class="text-2xl font-bold">{{ resolvedCount }}</p>
        </div>
      </div>
    </UCard>
  </div>

  <UCard class="mb-6">
    <div class="flex flex-col gap-4 lg:flex-row">
      <UInput
        v-model="filters.search"
        placeholder="Buscar por medicamento ou lote..."
        icon="i-lucide-search"
        clearable
        class="flex-1"
        aria-label="Buscar alerta"
        @clear="filters.search = ''"
      />

      <USelect
        v-model="filters.status"
        :items="statusOptions"
        class="lg:max-w-48"
        aria-label="Filtrar por status do alerta"
      />

      <USelect
        v-model="filters.priority"
        :items="priorityOptions"
        class="lg:max-w-48"
        aria-label="Filtrar por prioridade do alerta"
      />

      <UButton
        color="warning"
        class="cursor-pointer lg:max-w-40"
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
      <TableSkeleton :rows="5" :columns="8" />
    </div>

    <div v-else-if="filteredRows.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-check-circle" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Nenhum alerta encontrado</p>
      <p class="text-sm text-gray-400 mt-1">
        Não há alertas de validade para os filtros selecionados.
      </p>
    </div>

    <UTable
      v-else
      :data="paginatedRows"
      :columns="columns"
      caption="Lista de alertas de validade"
    >
      <template #medicineName-cell="{ row }">
        <div>
          <p class="font-medium text-gray-900">{{ row.original.medicineName }}</p>
          <p class="text-sm text-gray-500">{{ row.original.healthUnitName }}</p>
        </div>
      </template>

      <template #expiryDate-cell="{ row }">
        {{ formatDate(row.original.expiryDate) }}
      </template>

      <template #daysUntilExpiry-cell="{ row }">
        <UBadge
          :label="daysLabel(row.original.daysUntilExpiry)"
          :color="daysColor(row.original.daysUntilExpiry)"
          variant="subtle"
        />
      </template>

      <template #priority-cell="{ row }">
        <UBadge
          :label="priorityLabel(row.original.priority)"
          :color="priorityColor(row.original.priority)"
          variant="subtle"
        />
      </template>

      <template #resolved-cell="{ row }">
        <UBadge
          :label="row.original.resolved ? 'Resolvido' : 'Pendente'"
          :color="row.original.resolved ? 'success' : 'warning'"
          variant="subtle"
        />
      </template>

      <template #actions-cell="{ row }">
        <UButton
          v-if="isAdmin && !row.original.resolved"
          color="primary"
          variant="soft"
          size="xs"
          icon="i-lucide-check"
          class="cursor-pointer"
          @click="confirmResolve(row.original)"
        >
          Resolver
        </UButton>
        <span v-else class="text-sm text-gray-400">—</span>
      </template>
    </UTable>

    <div
      v-if="filteredRows.length > 0"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-100"
    >
      <p class="text-sm text-gray-500">
        Mostrando {{ from }} a {{ to }} de {{ filteredRows.length }}
        {{ filteredRows.length === 1 ? 'alerta' : 'alertas' }}
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
    v-if="showResolveModal"
    v-model:open="showResolveModal"
    :prevent-close="true"
    title="Resolver Alerta?"
  >
    <template #body>
      <p class="text-gray-500 mb-4">
        O alerta do lote
        <strong class="text-gray-700">{{ selectedAlert?.lotNumber }}</strong>
        ({{ selectedAlert?.medicineName }}) será marcado como resolvido.
      </p>

      <div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          :disabled="resolving"
          @click="showResolveModal = false"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          class="cursor-pointer"
          :loading="resolving"
          @click="handleResolve"
        >
          Resolver
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useStock, type ExpirationAlert } from '~/composables/useStock'
import { usePagination } from '~/composables/usePagination'

definePageMeta({
  layout: 'protected'
})

type AlertPriority = 'high' | 'medium' | 'low'

interface AlertRow {
  id: string
  medicineName: string
  lotNumber: string
  healthUnitName: string
  quantity: number
  expiryDate: string
  daysUntilExpiry: number | null
  priority: AlertPriority
  resolved: boolean
}

const toast = useToast()
const auth = useAuth()
const stock = useStock()

const { isAdmin } = auth
const {
  loading,
  error: stockError,
  alerts,
  batches,
  healthUnits,
  loadAll,
  resolveAlert,
  getBatchWithMedicine
} = stock

const statusOptions = [
  { label: 'Todos os status', value: 'all' },
  { label: 'Pendentes', value: 'pending' },
  { label: 'Resolvidos', value: 'resolved' }
]

const priorityOptions = [
  { label: 'Todas as prioridades', value: 'all' },
  { label: 'Alta', value: 'high' },
  { label: 'Média', value: 'medium' },
  { label: 'Baixa', value: 'low' }
]

const columns: TableColumn<AlertRow>[] = [
  { accessorKey: 'medicineName', header: 'Medicamento / Unidade', enableSorting: true },
  { accessorKey: 'lotNumber', header: 'Lote', enableSorting: true },
  { accessorKey: 'quantity', header: 'Quantidade', enableSorting: true },
  { accessorKey: 'expiryDate', header: 'Vencimento', enableSorting: true },
  { accessorKey: 'daysUntilExpiry', header: 'Dias Restantes', enableSorting: true },
  { accessorKey: 'priority', header: 'Prioridade', enableSorting: true },
  { accessorKey: 'resolved', header: 'Status', enableSorting: true },
  {
    id: 'actions',
    header: 'Ações',
    meta: { class: { th: 'w-24', td: 'w-28' } }
  }
]

const filters = ref({
  search: '',
  status: 'all',
  priority: 'all'
})

const showResolveModal = ref(false)
const resolving = ref(false)
const selectedAlert = ref<AlertRow | null>(null)

const rows = computed<AlertRow[]>(() =>
  alerts.value.map(alert => {
    const batch = batches.value.find(item => item.id === alert.batchId) || null
    const enriched = batch ? getBatchWithMedicine(batch.id) : null
    const unitId = alert.healthUnitId || batch?.healthUnitId || ''
    const unit = healthUnits.value.find(item => item.id === unitId) || null
    const expiryDate = alert.expiryDate || alert.alertDate || ''
    const days = getDaysUntilExpiry(alert)

    return {
      id: alert.id,
      medicineName: alert.medicineName || enriched?.medicineName || 'Desconhecido',
      lotNumber: alert.lotNumber || batch?.batchNumber || '—',
      healthUnitName: unit?.name || '—',
      quantity: alert.quantity ?? batch?.quantity ?? 0,
      expiryDate,
      daysUntilExpiry: days,
      priority: normalizePriority(alert.priority, days),
      resolved: Boolean(alert.resolved)
    }
  })
)

const pendingCount = computed(
  () => rows.value.filter(row => !row.resolved).length
)

const resolvedCount = computed(
  () => rows.value.filter(row => row.resolved).length
)

const highPriorityCount = computed(
  () =>
    rows.value.filter(row => !row.resolved && row.priority === 'high').length
)

const isAnyFilterApplied = computed(
  () =>
    filters.value.search !== '' ||
    filters.value.status !== 'all' ||
    filters.value.priority !== 'all'
)

const filteredRows = computed(() => {
  let result = rows.value

  if (filters.value.status === 'pending') {
    result = result.filter(row => !row.resolved)
  } else if (filters.value.status === 'resolved') {
    result = result.filter(row => row.resolved)
  }

  if (filters.value.priority !== 'all') {
    result = result.filter(row => row.priority === filters.value.priority)
  }

  const term = filters.value.search.trim().toLowerCase()
  if (term) {
    result = result.filter(
      row =>
        row.medicineName.toLowerCase().includes(term) ||
        row.lotNumber.toLowerCase().includes(term) ||
        row.healthUnitName.toLowerCase().includes(term)
    )
  }

  return result
})

const { page, pageSize, from, to, paginated: paginatedRows } =
  usePagination(filteredRows)

watch(filters, () => {
  page.value = 1
}, { deep: true })

function getDaysUntilExpiry(alert: ExpirationAlert): number | null {
  const date = alert.expiryDate || alert.alertDate

  if (date) {
    const target = parseDate(date)
    if (!Number.isNaN(target.getTime())) {
      const today = new Date()
      return Math.ceil(
        (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      )
    }
  }

  if (typeof alert.daysUntilExpiry === 'number') return alert.daysUntilExpiry

  return null
}

function parseDate(value: string): Date {
  return new Date(value.includes('T') ? value : `${value}T12:00:00`)
}

function normalizePriority(
  priority: string | undefined,
  days: number | null
): AlertPriority {
  if (priority === 'high' || priority === 'medium' || priority === 'low') {
    return priority
  }

  if (days === null) return 'low'
  if (days <= 7) return 'high'
  if (days <= 30) return 'medium'
  return 'low'
}

function daysLabel(days: number | null): string {
  if (days === null) return '—'
  if (days < 0) return 'Vencido'
  if (days === 0) return 'Vence hoje'
  return `${days} ${days === 1 ? 'dia' : 'dias'}`
}

function daysColor(days: number | null): any {
  if (days === null) return 'neutral'
  if (days <= 7) return 'error'
  if (days <= 30) return 'warning'
  return 'success'
}

function priorityLabel(priority: AlertPriority): string {
  const labels: Record<AlertPriority, string> = {
    high: 'Alta',
    medium: 'Média',
    low: 'Baixa'
  }
  return labels[priority]
}

function priorityColor(priority: AlertPriority): any {
  const colors: Record<AlertPriority, string> = {
    high: 'error',
    medium: 'warning',
    low: 'neutral'
  }
  return colors[priority]
}

function formatDate(value: string): string {
  if (!value) return '—'

  const date = parseDate(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function resetFilters() {
  filters.value = {
    search: '',
    status: 'all',
    priority: 'all'
  }
}

function confirmResolve(alert: AlertRow) {
  selectedAlert.value = alert
  showResolveModal.value = true
}

async function handleResolve() {
  if (!selectedAlert.value) return

  resolving.value = true

  try {
    await resolveAlert(selectedAlert.value.id)

    toast.add({
      title: 'Alerta resolvido',
      description: 'O alerta foi marcado como resolvido.',
      icon: 'i-lucide-check',
      color: 'primary'
    })

    showResolveModal.value = false
    selectedAlert.value = null
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível resolver o alerta.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    resolving.value = false
  }
}

async function loadAlerts() {
  try {
    await loadAll()
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar os alertas.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

onMounted(async () => {
  await loadAlerts()
})
</script>
