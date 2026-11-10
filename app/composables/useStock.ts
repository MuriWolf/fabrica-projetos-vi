import medicinesData from '~/mocks/stock/medicines.json'
import batchesData from '~/mocks/stock/batches.json'
import healthUnitsData from '~/mocks/stock/healthUnits.json'
import movementsData from '~/mocks/stock/stockMovements.json'
import alertsData from '~/mocks/stock/expirationAlerts.json'

export type BatchStatus = 'available' | 'low_stock' | 'expiring_soon' | 'critical'

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
  quantity: number
  status: BatchStatus
  stockId?: string
  healthUnitId?: string
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
}

export interface Stock {
  id: string
  pharmacyId?: string | null
  healthUnitId?: string | null
  batchId?: string | null
  quantity: number
}

export interface ExpirationAlert {
  id: string
  medicineId: string
  batchId: string
  alertDate: string
  resolved: boolean
  medicineName?: string
  lotNumber?: string
  healthUnitId?: string
  quantity?: number
  expiryDate?: string
  daysUntilExpiry?: number
  priority?: string
  createdAt?: string
}

export interface BatchInput {
  medicineId: string
  batchNumber: string
  fabricationDate: string
  expirationDate: string
  quantity?: number
  healthUnitId?: string
}

interface ApiBatch {
  id: string
  medicineId: string
  batchNumber: string
  fabricationDate: string
  expirationDate: string
}

interface ApiStock {
  id: string
  pharmacyId?: string | null
  healthUnitId?: string | null
  batchId?: string | null
  quantity: number
}

interface ApiMovement {
  id: string
  stockId: string
  batchId: string
  medicineId: string
  type: 'Entry' | 'Exit' | number | string
  quantity: number
}

interface ApiAlert {
  id: string
  medicineId: string
  batchId: string
  alertDate: string
  resolved: boolean
}

const LOW_STOCK_THRESHOLD = 100
const EXPIRING_SOON_DAYS = 30
const ALERT_WINDOW_DAYS = 60

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// <input type="date"> expects YYYY-MM-DD, but the API returns full ISO dates.
function toDateOnly(value: string): string {
  return value?.length >= 10 ? value.slice(0, 10) : value
}

export function daysUntil(date: string): number {
  const target = new Date(date)
  const today = new Date()

  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function deriveBatchStatus(batch: Pick<Batch, 'quantity' | 'expirationDate'>): BatchStatus {
  const quantity = batch.quantity ?? 0
  const days = daysUntil(batch.expirationDate)

  if (Number.isNaN(days)) return 'critical'
  if (days < 0 || quantity <= 0) return 'critical'
  if (days <= EXPIRING_SOON_DAYS) return 'expiring_soon'
  if (quantity <= LOW_STOCK_THRESHOLD) return 'low_stock'

  return 'available'
}

// The UI only supports Entry/Exit; ignore other backend enum values.
function normalizeMovementType(type: ApiMovement['type']): 'Entry' | 'Exit' | null {
  if (type === 'Entry' || type === 0 || type === '0') return 'Entry'
  if (type === 'Exit' || type === 1 || type === '1') return 'Exit'
  return null
}

function toMovements(list: ApiMovement[]): StockMovement[] {
  return list.flatMap(movement => {
    const type = normalizeMovementType(movement.type)
    return type ? [{ ...movement, type }] : []
  })
}

function toMockBatch(raw: any): Batch {
  const batch = {
    id: String(raw.id),
    medicineId: String(raw.medicineId),
    batchNumber: raw.batchNumber,
    fabricationDate: raw.fabricationDate,
    expirationDate: raw.expirationDate,
    quantity: raw.quantity ?? 0
  }

  return {
    ...batch,
    status: deriveBatchStatus(batch),
    stockId: `stock-${batch.id}`,
    healthUnitId: raw.healthUnitId ?? healthUnitsData.healthUnits[0]?.id
  }
}

function toApiBatch(batch: ApiBatch, stocks: ApiStock[]): Batch {
  const batchStocks = stocks.filter(stock => stock.batchId === batch.id)
  const quantity = batchStocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0)
  const firstStock = batchStocks[0]

  return {
    ...batch,
    fabricationDate: toDateOnly(batch.fabricationDate),
    expirationDate: toDateOnly(batch.expirationDate),
    quantity,
    status: deriveBatchStatus({ quantity, expirationDate: batch.expirationDate }),
    stockId: firstStock?.id,
    healthUnitId: firstStock?.healthUnitId || undefined
  }
}

export function useStock() {
  const config = useRuntimeConfig()
  const useMocks = config.public.useMocks
  const api = useApi()

  const medicines = useState<Medicine[]>('stock_medicines', () =>
    useMocks ? medicinesData.medicines.map(medicine => ({ ...medicine })) : []
  )
  const batches = useState<Batch[]>('stock_batches', () =>
    useMocks ? batchesData.batches.map(toMockBatch) : []
  )
  const healthUnits = useState<HealthUnit[]>('stock_health_units', () =>
    useMocks ? healthUnitsData.healthUnits.map(unit => ({ ...unit })) : []
  )
  const movements = useState<StockMovement[]>('stock_movements', () =>
    useMocks ? toMovements(movementsData.movements as ApiMovement[]) : []
  )
  const stocks = useState<Stock[]>('stock_stocks', () => [])
  const alerts = useState<ExpirationAlert[]>('stock_alerts', () =>
    useMocks
      ? (alertsData.alerts as any[]).map(alert => ({
          ...alert,
          resolved: alert.resolved ?? false
        }))
      : []
  )
  const loading = useState<boolean>('stock_loading', () => false)
  const error = useState<string | null>('stock_error', () => null)

  function rebuildMockStocks() {
    stocks.value = batches.value.map(batch => ({
      id: batch.stockId || `stock-${batch.id}`,
      healthUnitId: batch.healthUnitId || healthUnits.value[0]?.id || null,
      batchId: batch.id,
      quantity: batch.quantity
    }))
  }

  function rebuildMockAlerts() {
    const resolvedById = new Map(
      alerts.value.map(alert => [alert.id, alert.resolved])
    )

    const derivedAlerts: ExpirationAlert[] = batches.value
      .filter(batch => daysUntil(batch.expirationDate) <= ALERT_WINDOW_DAYS)
      .map(batch => {
        const medicine = medicines.value.find(item => item.id === batch.medicineId)

        return {
          id: `alert-${batch.id}`,
          medicineId: batch.medicineId,
          batchId: batch.id,
          alertDate: batch.expirationDate,
          resolved: resolvedById.get(`alert-${batch.id}`) ?? false,
          medicineName: medicine?.name,
          lotNumber: batch.batchNumber,
          quantity: batch.quantity,
          expiryDate: batch.expirationDate,
          daysUntilExpiry: daysUntil(batch.expirationDate)
        }
      })

    // Mantém os alertas pré-carregados cujos lotes não fazem parte da lista
    // local, para que a tela de alertas tenha dados no modo mock.
    const derivedBatchIds = new Set(derivedAlerts.map(alert => alert.batchId))
    const preservedAlerts = alerts.value
      .filter(alert => !derivedBatchIds.has(alert.batchId))
      .map(alert => ({
        ...alert,
        resolved: resolvedById.get(alert.id) ?? Boolean(alert.resolved)
      }))

    const merged = new Map<string, ExpirationAlert>()

    for (const alert of preservedAlerts) merged.set(alert.id, alert)
    for (const alert of derivedAlerts) merged.set(alert.id, alert)

    alerts.value = Array.from(merged.values())
  }

  async function loadAll() {
    loading.value = true
    error.value = null

    try {
      if (useMocks) {
        await delay(300)

        batches.value = batches.value.map(batch => ({
          ...batch,
          quantity: batch.quantity ?? 0,
          status: deriveBatchStatus(batch)
        }))

        rebuildMockStocks()
        rebuildMockAlerts()
      } else {
        const [medicineList, batchList, unitList, stockList, movementList, alertList] = await Promise.all([
          api<Medicine[]>('/api/medicines'),
          api<ApiBatch[]>('/api/batches'),
          api<HealthUnit[]>('/api/healthUnits'),
          api<ApiStock[]>('/api/stocks'),
          api<ApiMovement[]>('/api/stockMovements'),
          api<ApiAlert[]>('/api/expirationAlerts')
        ])

        medicines.value = medicineList
        healthUnits.value = unitList
        stocks.value = stockList
        movements.value = toMovements(movementList)
        alerts.value = alertList
        batches.value = batchList.map(batch => toApiBatch(batch, stockList))
      }

      return {
        medicines: medicines.value,
        batches: batches.value,
        healthUnits: healthUnits.value,
        stocks: stocks.value,
        alerts: alerts.value
      }
    } catch (err: any) {
      error.value = err?.data?.message || err?.message || 'Erro ao carregar estoque'
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
    return medicines.value.find(medicine => medicine.id === id) || null
  }

  async function createMedicine(data: Omit<Medicine, 'id'>): Promise<Medicine> {
    if (useMocks) {
      await delay(300)

      const medicine: Medicine = { id: `med-${Date.now()}`, ...data }
      medicines.value.push(medicine)
      return medicine
    }

    const medicine = await api<Medicine>('/api/medicines', {
      method: 'POST',
      body: data
    })

    medicines.value.push(medicine)
    return medicine
  }

  async function updateMedicine(id: string, data: Partial<Medicine>): Promise<Medicine | null> {
    if (useMocks) {
      await delay(300)

      const index = medicines.value.findIndex(medicine => medicine.id === id)
      if (index === -1) return null

      medicines.value[index] = { ...medicines.value[index], ...data } as Medicine
      return medicines.value[index]
    }

    const current = medicines.value.find(medicine => medicine.id === id)
    if (!current) return null

    const medicine = await api<Medicine>(`/api/medicines/${id}`, {
      method: 'PUT',
      body: {
        name: data.name ?? current.name,
        activeIngredient: data.activeIngredient ?? current.activeIngredient,
        dosage: data.dosage ?? current.dosage,
        unit: data.unit ?? current.unit
      }
    })

    const index = medicines.value.findIndex(item => item.id === id)
    if (index !== -1) medicines.value[index] = medicine

    return medicine
  }

  async function deleteMedicine(id: string): Promise<boolean> {
    if (useMocks) {
      await delay(300)

      const index = medicines.value.findIndex(medicine => medicine.id === id)
      if (index === -1) return false

      medicines.value.splice(index, 1)
      return true
    }

    await api(`/api/medicines/${id}`, { method: 'DELETE' })

    const index = medicines.value.findIndex(medicine => medicine.id === id)
    if (index !== -1) medicines.value.splice(index, 1)

    return true
  }

  // ============ BATCHES ============

  async function getBatches(): Promise<Batch[]> {
    await loadAll()
    return batches.value
  }

  async function getBatchById(id: string): Promise<Batch | null> {
    await loadAll()
    return batches.value.find(batch => batch.id === id) || null
  }

  async function createBatch(data: BatchInput): Promise<Batch> {
    if (useMocks) {
      await delay(300)

      const batch: Batch = {
        id: `batch-${Date.now()}`,
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        fabricationDate: data.fabricationDate,
        expirationDate: data.expirationDate,
        quantity: data.quantity ?? 0,
        status: 'available',
        stockId: `stock-batch-${Date.now()}`,
        healthUnitId: data.healthUnitId || healthUnits.value[0]?.id
      }

      batch.status = deriveBatchStatus(batch)
      batches.value.push(batch)
      rebuildMockStocks()

      return batch
    }

    const created = await api<ApiBatch>('/api/batches', {
      method: 'POST',
      body: {
        medicineId: data.medicineId,
        batchNumber: data.batchNumber,
        fabricationDate: data.fabricationDate,
        expirationDate: data.expirationDate
      }
    })

    const quantity = data.quantity ?? 0
    let stock: ApiStock | undefined

    if (quantity > 0) {
      stock = await api<ApiStock>('/api/stocks', {
        method: 'POST',
        body: {
          healthUnitId: data.healthUnitId || healthUnits.value[0]?.id || null,
          batchId: created.id,
          quantity
        }
      })

      stocks.value.push(stock)
    }

    const batch: Batch = {
      ...created,
      fabricationDate: toDateOnly(created.fabricationDate),
      expirationDate: toDateOnly(created.expirationDate),
      quantity,
      status: deriveBatchStatus({ quantity, expirationDate: created.expirationDate }),
      stockId: stock?.id,
      healthUnitId: stock?.healthUnitId || data.healthUnitId || healthUnits.value[0]?.id
    }

    batches.value.push(batch)
    return batch
  }

  async function updateBatch(id: string, data: Partial<BatchInput>): Promise<Batch | null> {
    if (useMocks) {
      await delay(300)

      const index = batches.value.findIndex(batch => batch.id === id)
      const current = batches.value[index]
      if (!current) return null

      const updated = {
        ...current,
        ...data,
        quantity: data.quantity ?? current.quantity
      } as Batch

      updated.status = deriveBatchStatus(updated)
      batches.value[index] = updated
      rebuildMockStocks()

      return updated
    }

    const current = batches.value.find(batch => batch.id === id)
    if (!current) return null

    const updated = await api<ApiBatch>(`/api/batches/${id}`, {
      method: 'PUT',
      body: {
        medicineId: data.medicineId ?? current.medicineId,
        batchNumber: data.batchNumber ?? current.batchNumber,
        fabricationDate: data.fabricationDate ?? current.fabricationDate,
        expirationDate: data.expirationDate ?? current.expirationDate
      }
    })

    const existingStock = stocks.value.find(stock => stock.batchId === id)
    let stock: ApiStock | undefined = existingStock
    const quantity = data.quantity ?? existingStock?.quantity ?? current.quantity

    if (typeof data.quantity === 'number') {
      if (existingStock) {
        stock = await api<ApiStock>(`/api/stocks/${existingStock.id}`, {
          method: 'PUT',
          body: {
            pharmacyId: existingStock.pharmacyId ?? null,
            healthUnitId: existingStock.healthUnitId ?? healthUnits.value[0]?.id ?? null,
            batchId: id,
            quantity: data.quantity
          }
        })

        Object.assign(existingStock, stock)
      } else if (data.quantity > 0) {
        stock = await api<ApiStock>('/api/stocks', {
          method: 'POST',
          body: {
            healthUnitId: healthUnits.value[0]?.id || null,
            batchId: id,
            quantity: data.quantity
          }
        })

        stocks.value.push(stock)
      }
    }

    const batch: Batch = {
      ...updated,
      fabricationDate: toDateOnly(updated.fabricationDate),
      expirationDate: toDateOnly(updated.expirationDate),
      quantity,
      status: deriveBatchStatus({ quantity, expirationDate: updated.expirationDate }),
      stockId: stock?.id,
      healthUnitId: stock?.healthUnitId || data.healthUnitId || undefined
    }

    const index = batches.value.findIndex(item => item.id === id)
    if (index !== -1) batches.value[index] = batch

    return batch
  }

  async function deleteBatch(id: string): Promise<boolean> {
    if (useMocks) {
      await delay(300)

      const index = batches.value.findIndex(batch => batch.id === id)
      if (index === -1) return false

      batches.value.splice(index, 1)
      stocks.value = stocks.value.filter(stock => stock.batchId !== id)
      rebuildMockAlerts()

      return true
    }

    const batchStocks = stocks.value.filter(stock => stock.batchId === id)

    await Promise.all(
      batchStocks.map(stock => api(`/api/stocks/${stock.id}`, { method: 'DELETE' }))
    )
    await api(`/api/batches/${id}`, { method: 'DELETE' })

    batches.value = batches.value.filter(batch => batch.id !== id)
    stocks.value = stocks.value.filter(stock => stock.batchId !== id)

    return true
  }

  // ============ HEALTH UNITS ============

  async function getHealthUnits(): Promise<HealthUnit[]> {
    await loadAll()
    return healthUnits.value
  }

  async function getHealthUnitById(id: string): Promise<HealthUnit | null> {
    await loadAll()
    return healthUnits.value.find(unit => unit.id === id) || null
  }

  // ============ STOCK MOVEMENTS ============

  async function getMovements(): Promise<StockMovement[]> {
    await loadAll()
    return movements.value
  }

  async function createMovement(data: Omit<StockMovement, 'id'>): Promise<StockMovement> {
    if (useMocks) {
      await delay(300)

      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        ...data
      }

      movements.value.push(movement)

      const stock = stocks.value.find(item => item.id === data.stockId)
      if (stock) {
        stock.quantity += data.type === 'Entry' ? data.quantity : -data.quantity

        const batch = batches.value.find(item => item.id === data.batchId)
        if (batch) {
          batch.quantity = stock.quantity
          batch.status = deriveBatchStatus(batch)
        }
      }

      return movement
    }

    const movement = await api<ApiMovement>('/api/stockMovements', {
      method: 'POST',
      body: {
        stockId: data.stockId,
        batchId: data.batchId,
        medicineId: data.medicineId,
        // The reference backend still serializes the enum as a number.
        type: data.type === 'Exit' ? 1 : 0,
        quantity: data.quantity
      }
    })

    const normalized: StockMovement = {
      ...movement,
      type: normalizeMovementType(movement.type) ?? data.type
    }

    movements.value.push(normalized)
    return normalized
  }

  // ============ EXPIRATION ALERTS ============

  async function getAlerts(): Promise<ExpirationAlert[]> {
    await loadAll()
    return alerts.value
  }

  async function resolveAlert(id: string): Promise<boolean> {
    if (useMocks) {
      await delay(300)

      const alert = alerts.value.find(item => item.id === id)
      if (!alert) return false

      alert.resolved = true
      return true
    }

    const alert = alerts.value.find(item => item.id === id)
    if (!alert) return false

    await api(`/api/expirationAlerts/${id}`, {
      method: 'PUT',
      body: {
        medicineId: alert.medicineId,
        batchId: alert.batchId,
        alertDate: alert.alertDate,
        resolved: true
      }
    })

    alert.resolved = true
    return true
  }

  // ============ HELPERS ============

  function getCategories(): string[] {
    if (useMocks) return [...medicinesData.categories]

    return Array.from(new Set(medicines.value.map(medicine => medicine.activeIngredient)))
  }

  function getBatchWithMedicine(batchId: string) {
    const batch = batches.value.find(item => item.id === batchId)
    if (!batch) return null

    const medicine = medicines.value.find(item => item.id === batch.medicineId)

    return {
      ...batch,
      medicineName: medicine?.name || 'Desconhecido',
      medicineDosage: medicine?.dosage || ''
    }
  }

  return {
    // State
    loading,
    error,
    medicines,
    batches,
    healthUnits,
    stocks,
    movements,
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
