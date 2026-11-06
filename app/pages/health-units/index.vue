<template>
  <div class="mb-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Unidades de Saúde</h1>
      <p class="text-gray-500">
        Consulte as unidades onde os estoques estão alocados
      </p>
    </div>
  </div>

  <UCard class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row">
      <UInput
        v-model="search"
        placeholder="Buscar por nome, bairro, zona ou CNES..."
        icon="i-lucide-search"
        clearable
        class="flex-1"
        aria-label="Buscar unidade de saúde"
        @clear="search = ''"
      />

      <UButton
        color="warning"
        class="cursor-pointer sm:max-w-40"
        :disabled="!search"
        @click="search = ''"
      >
        Limpar filtro
      </UButton>
    </div>
  </UCard>

  <UAlert
    v-if="stockError"
    color="error"
    variant="soft"
    icon="i-lucide-alert-circle"
    :title="stockError"
    class="mb-4"
  />

  <div v-if="loading" class="text-center py-12">
    <UIcon name="i-lucide-loader" class="w-8 h-8 animate-spin mx-auto mb-3" />
    <p class="text-gray-500">Carregando unidades de saúde...</p>
  </div>

  <div v-else-if="filteredUnits.length === 0" class="text-center py-12">
    <UIcon name="i-lucide-building-2" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p class="text-gray-500">Nenhuma unidade de saúde encontrada</p>
  </div>

  <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    <UCard
      v-for="unit in paginatedUnits"
      :key="unit.id"
      class="hover:shadow-md transition-shadow"
    >
      <template #header>
        <div class="flex items-start gap-3">
          <div
            class="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0"
          >
            <UIcon name="i-lucide-building-2" class="w-5 h-5 text-primary-600" />
          </div>
          <div class="min-w-0">
            <h2 class="font-semibold text-gray-900 truncate">{{ unit.name }}</h2>
            <p class="text-sm text-gray-500">{{ unit.zone || 'Zona não informada' }}</p>
          </div>
        </div>
      </template>

      <div class="space-y-2 text-sm text-gray-600">
        <p class="flex items-start gap-2">
          <UIcon name="i-lucide-map-pin" class="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
          {{ fullAddress(unit) }}
        </p>
        <p class="flex items-center gap-2">
          <UIcon name="i-lucide-hash" class="w-4 h-4 text-gray-400 flex-shrink-0" />
          CNES: {{ unit.cnes || 'Não informado' }}
        </p>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-info"
            class="cursor-pointer"
            @click="openDetails(unit)"
          >
            Ver detalhes
          </UButton>
        </div>
      </template>
    </UCard>
  </div>

  <div
    v-if="filteredUnits.length > 0"
    class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-100"
  >
    <p class="text-sm text-gray-500">
      Mostrando {{ from }} a {{ to }} de {{ filteredUnits.length }}
      {{ filteredUnits.length === 1 ? 'unidade' : 'unidades' }}
    </p>
    <UPagination
      v-model:page="page"
      :total="filteredUnits.length"
      :items-per-page="pageSize"
      :sibling-count="1"
      show-edges
    />
  </div>

  <UModal v-if="showDetailsModal" v-model:open="showDetailsModal" title="Detalhes da Unidade">
    <template #body>
      <div v-if="selectedUnit" class="space-y-4">
        <div class="flex items-center gap-3">
          <div
            class="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center"
          >
            <UIcon name="i-lucide-building-2" class="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ selectedUnit.name }}</h3>
            <p class="text-sm text-gray-500">{{ selectedUnit.zone }}</p>
          </div>
        </div>

        <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">Logradouro</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.street }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">Número</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.number }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">Bairro</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.neighborhood }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">CEP</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.zipCode }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">Zona</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.zone }}</dd>
          </div>
          <div>
            <dt class="text-xs uppercase tracking-wide text-gray-400">CNES</dt>
            <dd class="text-sm text-gray-700 mt-1">{{ selectedUnit.cnes }}</dd>
          </div>
        </dl>
      </div>

      <div class="flex justify-end mt-6">
        <UButton
          color="neutral"
          variant="ghost"
          class="cursor-pointer"
          @click="showDetailsModal = false"
        >
          Fechar
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { useStock, type HealthUnit } from '~/composables/useStock'
import { usePagination } from '~/composables/usePagination'

definePageMeta({
  layout: 'protected'
})

const toast = useToast()
const stock = useStock()

const { loading, error: stockError, healthUnits, loadAll } = stock

const search = ref('')
const showDetailsModal = ref(false)
const selectedUnit = ref<HealthUnit | null>(null)

const filteredUnits = computed(() => {
  const term = search.value.trim().toLowerCase()

  const units = [...healthUnits.value].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR')
  )

  if (!term) return units

  return units.filter(unit => {
    return [unit.name, unit.neighborhood, unit.zone, unit.cnes, unit.street]
      .filter(Boolean)
      .some(value => value.toLowerCase().includes(term))
  })
})

const { page, pageSize, from, to, paginated: paginatedUnits } =
  usePagination(filteredUnits, 6)

watch(search, () => {
  page.value = 1
})

function fullAddress(unit: HealthUnit): string {
  const street = [unit.street, unit.number].filter(Boolean).join(', ')
  const location = [unit.neighborhood, unit.zipCode].filter(Boolean).join(' · ')
  return [street, location].filter(Boolean).join(' — ') || 'Endereço não informado'
}

function openDetails(unit: HealthUnit) {
  selectedUnit.value = unit
  showDetailsModal.value = true
}

async function loadHealthUnits() {
  try {
    await loadAll()
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar as unidades de saúde.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

onMounted(async () => {
  await loadHealthUnits()
})
</script>
