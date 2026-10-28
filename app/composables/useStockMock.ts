import medicinesData from '~/mocks/stock/medicines.json'
import batchesData from '~/mocks/stock/batches.json'
import healthUnitsData from '~/mocks/stock/healthUnits.json'
import movementsData from '~/mocks/stock/stockMovements.json'

export interface Medicine {
  id: string
  name: string
  activeIngredient: string
  dosage: string
  unit: string
}

export interface Batch {
  id: string
  medicineId: string
  batchNumber: string
  fabricationDate: string
  expirationDate: string
  quantity?: number // Adicionado para mock (backend calcula via movimentações)
  status?: 'available' | 'low_stock' | 'expiring_soon' | 'critical'
}

export interface HealthUnit {
  id: string
  name: string
  street: string
  number: string
  neighborhood: string
  zipCode: string
  zone: string
  cnes: string
}

export interface StockMovement {
  id: string
  stockId: string
  batchId: string
  medicineId: string
  type: 'Entry' | 'Exit'
  quantity: number
  occurredAt: string
}

export interface Stock {
  id: string
  healthUnitId: string
  batchId: string
  quantity: number
}

export interface ExpirationAlert {
  id: string
  medicineId: string
  batchId: string
  alertDate: string
  resolved: boolean
}

export function useStockMock() {
  const medicines = ref<Medicine[]>(medicinesData.medicines)
  const batches = ref<Batch[]>(batchesData.batches.map((b) => b as Batch))
  const healthUnits = ref<HealthUnit[]>(healthUnitsData.healthUnits)
  const movements = ref<StockMovement[]>(movementsData.movements.map(m => m as StockMovement))
  const stocks = ref<Stock[]>([])
  const alerts = ref<ExpirationAlert[]>([])

  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Carrega todos os dados do estoque */
  async function loadAll() {
    loading.value = true
    error.value = null

    try {
      await new Promise(resolve => setTimeout(resolve, 300)) // Delay fake
      
      // Calcula stocks a partir dos batches
      stocks.value = batches.value.map(batch => ({
        id: `stock-${batch.id}`,
        healthUnitId: '1', // Mock
        batchId: batch.id,
        quantity: batch.quantity || 0
      }))

      // Calcula alertas de vencimento
      const today = new Date()
      alerts.value = batches.value
        .filter(batch => {
          const expDate = new Date(batch.expirationDate)
          const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          return diffDays <= 60 // Alerta se vence em ≤ 60 dias
        })
        .map(batch => ({
          id: `alert-${batch.id}`,
          medicineId: batch.medicineId,
          batchId: batch.id,
          alertDate: batch.expirationDate,
          resolved: false
        }))

      return {
        medicines: medicines.value,
        batches: batches.value,
        healthUnits: healthUnits.value,
        stocks: stocks.value,
        alerts: alerts.value
      }
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar estoque'
      throw err
    } finally {
      loading.value = false
    }
  }

  // ============ MEDICINES ============

  async function getMedicines(): Promise<Medicine[]> {
    await loadAll()
    return medicines.value
  }

  async function getMedicineById(id: string): Promise<Medicine | null> {
    await loadAll()
    return medicines.value.find(m => m.id === id) || null
  }

  async function createMedicine(data: Omit<Medicine, 'id'>): Promise<Medicine> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newMedicine: Medicine = {
      id: `${Date.now()}`,
      ...data
    }
    
    medicines.value.push(newMedicine)
    return newMedicine
  }

  async function updateMedicine(id: string, data: Partial<Medicine>): Promise<Medicine | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = medicines.value.findIndex(m => m.id === id)
    if (index === -1) return null
    
    medicines.value[index] = { ...medicines.value[index], ...data } as Medicine
    return medicines.value[index]
  }

  async function deleteMedicine(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = medicines.value.findIndex(m => m.id === id)
    if (index === -1) return false
    
    medicines.value.splice(index, 1)
    return true
  }

  // ============ BATCHES ============

  async function getBatches(): Promise<Batch[]> {
    await loadAll()
    return batches.value
  }

  async function getBatchById(id: string): Promise<Batch | null> {
    await loadAll()
    return batches.value.find(b => b.id === id) || null
  }

  async function createBatch(data: Omit<Batch, 'id'>): Promise<Batch> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newBatch: Batch = {
      id: `batch-${Date.now()}`,
      ...data
    }
    
    batches.value.push(newBatch)
    return newBatch
  }

  async function updateBatch(id: string, data: Partial<Batch>): Promise<Batch | null> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = batches.value.findIndex(b => b.id === id)
    if (index === -1) return null
    
    batches.value[index] = { ...batches.value[index], ...data } as Batch
    return batches.value[index]
  }

  async function deleteBatch(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const index = batches.value.findIndex(b => b.id === id)
    if (index === -1) return false
    
    batches.value.splice(index, 1)
    return true
  }

  // ============ HEALTH UNITS ============

  async function getHealthUnits(): Promise<HealthUnit[]> {
    await loadAll()
    return healthUnits.value
  }

  async function getHealthUnitById(id: string): Promise<HealthUnit | null> {
    await loadAll()
    return healthUnits.value.find(h => h.id === id) || null
  }

  // ============ STOCK MOVEMENTS ============

  async function getMovements(): Promise<StockMovement[]> {
    await loadAll()
    return movements.value
  }

  async function createMovement(data: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const newMovement: StockMovement = {
      id: `mov-${Date.now()}`,
      ...data
    }
    
    movements.value.push(newMovement)
    return newMovement
  }

  // ============ EXPIRATION ALERTS ============

  async function getAlerts(): Promise<ExpirationAlert[]> {
    await loadAll()
    return alerts.value
  }

  async function resolveAlert(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    const alert = alerts.value.find(a => a.id === id)
    if (!alert) return false
    
    alert.resolved = true
    return true
  }

  // ============ HELPERS ============

  /** Busca medicamentos por categoria (ajuda na UI) */
  function getCategories(): string[] {
    // Mock - categoria não existe no DTO, mas é útil na UI
    return Array.from(new Set(
      medicinesData.medicines.map((m: any) => m.category || 'Geral')
    ))
  }

  /** Busca lote com nome do medicamento (join manual) */
  function getBatchWithMedicine(batchId: string) {
    const batch = batches.value.find(b => b.id === batchId)
    if (!batch) return null
    
    const medicine = medicines.value.find(m => m.id === batch.medicineId)
    
    return {
      ...batch,
      medicineName: medicine?.name || 'Desconhecido',
      medicineDosage: medicine?.dosage || ''
    }
  }

  return {
    // States
    loading,
    error,
    medicines,
    batches,
    healthUnits,
    stocks,
    alerts,
    
    // Load
    loadAll,
    
    // Medicines
    getMedicines,
    getMedicineById,
    createMedicine,
    updateMedicine,
    deleteMedicine,
    
    // Batches
    getBatches,
    getBatchById,
    createBatch,
    updateBatch,
    deleteBatch,
    getBatchWithMedicine,
    
    // Health Units
    getHealthUnits,
    getHealthUnitById,
    
    // Movements
    getMovements,
    createMovement,
    
    // Alerts
    getAlerts,
    resolveAlert,
    
    // Helpers
    getCategories
  }
}