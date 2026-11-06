<template>
  <div class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Medicamentos</h1>
        <p class="text-gray-500">Cadastre e gerencie os medicamentos disponíveis</p>
      </div>

      <UButton
        v-if="isAdmin"
        color="primary"
        icon="i-lucide-plus"
        class="cursor-pointer"
        @click="openCreateModal"
      >
        Novo Medicamento
      </UButton>
    </div>
  </div>

  <UCard class="mb-6">
    <div class="flex flex-col gap-4 sm:flex-row">
      <UInput
        v-model="search"
        placeholder="Buscar por nome, princípio ativo ou dosagem..."
        icon="i-lucide-search"
        clearable
        class="flex-1"
        aria-label="Buscar medicamento"
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

  <UCard>
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
      <p class="text-gray-500">Carregando medicamentos...</p>
    </div>

    <div v-else-if="filteredMedicines.length === 0" class="text-center py-12">
      <UIcon name="i-lucide-pill" class="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p class="text-gray-500">Nenhum medicamento encontrado</p>
      <p v-if="isAdmin" class="text-sm text-gray-400 mt-1">
        Cadastre o primeiro medicamento para começar.
      </p>
    </div>

    <UTable
      v-else
      :data="paginatedMedicines"
      :columns="columns"
      caption="Lista de medicamentos"
    >
      <template #name-cell="{ row }">
        <div>
          <p class="font-medium text-gray-900">{{ row.original.name }}</p>
          <p class="text-sm text-gray-500">
            {{ row.original.dosage }} · {{ row.original.unit }}
          </p>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div v-if="isAdmin" class="flex items-center gap-2">
          <UButton
            color="primary"
            variant="soft"
            size="xs"
            icon="i-lucide-edit-2"
            class="cursor-pointer"
            aria-label="Editar medicamento"
            title="Editar medicamento"
            @click="openEditModal(row.original)"
          />
          <UButton
            color="error"
            variant="soft"
            size="xs"
            icon="i-lucide-trash-2"
            class="cursor-pointer"
            aria-label="Excluir medicamento"
            title="Excluir medicamento"
            @click="confirmDelete(row.original)"
          />
        </div>
      </template>
    </UTable>

    <div
      v-if="filteredMedicines.length > 0"
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-100"
    >
      <p class="text-sm text-gray-500">
        Mostrando {{ from }} a {{ to }} de {{ filteredMedicines.length }}
        {{ filteredMedicines.length === 1 ? 'medicamento' : 'medicamentos' }}
      </p>
      <UPagination
        v-model:page="page"
        :total="filteredMedicines.length"
        :items-per-page="pageSize"
        :sibling-count="1"
        show-edges
      />
    </div>
  </UCard>

  <UModal
    v-if="showFormModal"
    v-model:open="showFormModal"
    :title="editingMedicine ? 'Editar Medicamento' : 'Novo Medicamento'"
  >
    <template #body>
      <UForm
        :schema="medicineSchema"
        :state="formData"
        class="space-y-4"
        @submit="handleSave"
      >
        <UFormField name="name" label="Nome" required>
          <UInput
            v-model="formData.name"
            placeholder="Paracetamol 500mg"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <UFormField name="activeIngredient" label="Princípio Ativo" required>
          <UInput
            v-model="formData.activeIngredient"
            placeholder="Paracetamol"
            class="w-full"
            :disabled="saving"
          />
        </UFormField>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField name="dosage" label="Dosagem" required>
            <UInput
              v-model="formData.dosage"
              placeholder="500mg"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>

          <UFormField name="unit" label="Unidade" required>
            <UInput
              v-model="formData.unit"
              placeholder="comprimido"
              class="w-full"
              :disabled="saving"
            />
          </UFormField>
        </div>

        <div class="flex justify-end gap-3 w-full">
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
            {{ editingMedicine ? 'Atualizar' : 'Criar' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>

  <UModal
    v-if="showDeleteModal"
    v-model:open="showDeleteModal"
    :prevent-close="true"
    title="Excluir Medicamento?"
  >
    <template #body>
      <p class="text-gray-500 mb-4">
        Esta ação não pode ser desfeita. O medicamento
        <strong class="text-gray-700">{{ selectedMedicine?.name }}</strong>
        será permanentemente removido.
      </p>

      <div class="flex justify-end gap-3">
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
          class="cursor-pointer"
          :loading="deleting"
          @click="handleDelete"
        >
          Excluir
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { useStock, type Medicine } from '~/composables/useStock'
import { usePagination } from '~/composables/usePagination'
import {
  medicineSchema,
  type MedicineFormData
} from '~/composables/useMedicineSchema'

definePageMeta({
  layout: 'protected'
})

interface MedicineRow {
  id: string
  name: string
  activeIngredient: string
  dosage: string
  unit: string
}

const toast = useToast()
const auth = useAuth()
const stock = useStock()

const { isAdmin } = auth
const {
  loading,
  error: stockError,
  medicines,
  loadAll,
  createMedicine,
  updateMedicine,
  deleteMedicine
} = stock

const search = ref('')
const showFormModal = ref(false)
const showDeleteModal = ref(false)
const saving = ref(false)
const deleting = ref(false)
const editingMedicine = ref<Medicine | null>(null)
const selectedMedicine = ref<Medicine | null>(null)

const formData = ref<MedicineFormData>({
  name: '',
  activeIngredient: '',
  dosage: '',
  unit: ''
})

const columns: ComputedRef<TableColumn<MedicineRow>[]> = computed(() => {
  const fields: TableColumn<MedicineRow>[] = [
    { accessorKey: 'name', header: 'Medicamento', enableSorting: true },
    { accessorKey: 'activeIngredient', header: 'Princípio Ativo', enableSorting: true },
    { accessorKey: 'dosage', header: 'Dosagem', enableSorting: true },
    { accessorKey: 'unit', header: 'Unidade', enableSorting: true }
  ]

  if (isAdmin.value) {
    fields.push({
      id: 'actions',
      header: 'Ações',
      meta: { class: { th: 'w-20', td: 'w-24' } }
    })
  }

  return fields
})

const filteredMedicines = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return [...medicines.value]

  return medicines.value.filter(medicine => {
    return (
      medicine.name.toLowerCase().includes(term) ||
      medicine.activeIngredient.toLowerCase().includes(term) ||
      medicine.dosage.toLowerCase().includes(term) ||
      medicine.unit.toLowerCase().includes(term)
    )
  })
})

const { page, pageSize, from, to, paginated: paginatedMedicines } =
  usePagination(filteredMedicines)

watch(search, () => {
  page.value = 1
})

async function loadMedicines() {
  try {
    await loadAll()
  } catch {
    toast.add({
      title: 'Erro',
      description: 'Não foi possível carregar os medicamentos.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  }
}

function resetForm() {
  editingMedicine.value = null
  formData.value = {
    name: '',
    activeIngredient: '',
    dosage: '',
    unit: ''
  }
}

function openCreateModal() {
  resetForm()
  showFormModal.value = true
}

function openEditModal(medicine: Medicine) {
  editingMedicine.value = medicine
  formData.value = {
    name: medicine.name,
    activeIngredient: medicine.activeIngredient,
    dosage: medicine.dosage,
    unit: medicine.unit
  }
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
  resetForm()
}

async function handleSave(event: { data: MedicineFormData }) {
  saving.value = true

  try {
    if (editingMedicine.value) {
      await updateMedicine(editingMedicine.value.id, event.data)
      toast.add({
        title: 'Sucesso!',
        description: 'Medicamento atualizado com sucesso.',
        icon: 'i-lucide-check',
        color: 'primary'
      })
    } else {
      await createMedicine(event.data)
      toast.add({
        title: 'Sucesso!',
        description: 'Medicamento criado com sucesso.',
        icon: 'i-lucide-check',
        color: 'primary'
      })
    }

    await loadMedicines()
    closeFormModal()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível salvar o medicamento.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

function confirmDelete(medicine: Medicine) {
  selectedMedicine.value = medicine
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!selectedMedicine.value) return

  deleting.value = true

  try {
    await deleteMedicine(selectedMedicine.value.id)
    toast.add({
      title: 'Sucesso!',
      description: 'Medicamento excluído com sucesso.',
      icon: 'i-lucide-check',
      color: 'primary'
    })
    showDeleteModal.value = false
    await loadMedicines()
  } catch (err: any) {
    toast.add({
      title: 'Erro',
      description: err.message || 'Não foi possível excluir o medicamento.',
      icon: 'i-lucide-x-circle',
      color: 'error'
    })
  } finally {
    deleting.value = false
    selectedMedicine.value = null
  }
}

onMounted(async () => {
  await loadMedicines()
})
</script>
