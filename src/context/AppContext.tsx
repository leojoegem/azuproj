import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { mockAssets, mockAuditLog, mockNotifications } from '@/data/mockAssets'
import { nextAssetId } from '@/lib/utils'
import type {
  AppNotification,
  Asset,
  AssessmentStatus,
  AuditEvent,
  DispositionPath,
  PhysicalAssessment,
  TechnicalAssessment,
} from '@/types/asset'

type Theme = 'light' | 'dark'

interface RegisterAssetInput {
  device: string
  manufacturer: Asset['manufacturer']
  model: string
  serialNumber: string
  location: string
  storage: string
  processor: string
  ram: string
}

interface AssessmentUpdate {
  physicalChecks: PhysicalAssessment
  diagnosticChecks: TechnicalAssessment
  notes: string
  conditionScore: number
  physicalCondition: Asset['physicalCondition']
  technicalCondition: Asset['technicalCondition']
  recommendedAction: string
  recommendedPath: DispositionPath
  assessmentStatus: AssessmentStatus
}

interface AppContextValue {
  assets: Asset[]
  auditLog: AuditEvent[]
  notifications: AppNotification[]
  theme: Theme
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleTheme: () => void
  registerAsset: (input: RegisterAssetInput) => Asset
  updateAsset: (id: string, patch: Partial<Asset>) => void
  saveAssessment: (id: string, update: AssessmentUpdate) => void
  startSanitization: (id: string, method: NonNullable<Asset['sanitizationMethod']>) => void
  completeSanitization: (id: string, passed: boolean) => void
  approveDisposition: (id: string, path: DispositionPath) => void
  requestReview: (id: string) => void
  rejectDisposition: (id: string) => void
  addAudit: (event: Omit<AuditEvent, 'id'>) => void
  markNotificationsRead: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

function scoreToCondition(score: number): Asset['physicalCondition'] {
  if (score >= 90) return 'Excellent'
  if (score >= 75) return 'Good'
  if (score >= 55) return 'Fair'
  if (score >= 35) return 'Poor'
  return 'Scrap'
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>(mockAssets)
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(mockAuditLog)
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications)
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('reset-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('reset-theme', theme)
  }, [theme])

  const addAudit = useCallback((event: Omit<AuditEvent, 'id'>) => {
    setAuditLog((prev) => [
      {
        ...event,
        id: `AUD-${Date.now()}`,
      },
      ...prev,
    ])
  }, [])

  const updateAsset = useCallback((id: string, patch: Partial<Asset>) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === id
          ? { ...asset, ...patch, updatedAt: new Date().toISOString() }
          : asset,
      ),
    )
  }, [])

  const registerAsset = useCallback(
    (input: RegisterAssetInput) => {
      const id = nextAssetId(assets.map((a) => a.id))
      const now = new Date().toISOString()
      const asset: Asset = {
        id,
        device: input.device,
        manufacturer: input.manufacturer,
        model: input.model,
        serialNumber: input.serialNumber,
        assetTag: `MF-KE-${id.slice(-4)}`,
        processor: input.processor,
        ram: input.ram,
        storage: input.storage,
        os: input.manufacturer === 'Apple' ? 'macOS Sequoia' : 'Windows 11 Pro',
        purchaseYear: 2023,
        location: input.location,
        physicalCondition: 'Fair',
        technicalCondition: 'Passed',
        conditionScore: 0,
        recommendedAction: 'Await physical assessment',
        recommendedPath: 'Resale',
        assessor: '',
        assessmentStatus: 'Pending',
        sanitizationMethod: null,
        sanitizationStatus: 'Not Started',
        sanitizationOperator: null,
        sanitizationStarted: null,
        sanitizationCompleted: null,
        verification: 'Not Started',
        certificateId: null,
        sanitizationStep: 0,
        disposition: null,
        estimatedValue: 0,
        refurbishmentCost: 0,
        approval: 'Pending',
        dispositionStatus: 'Queued',
        updatedAt: now,
        receivedAt: now,
        physicalChecks: {
          screen: 'Good',
          keyboard: 'Good',
          trackpad: 'Good',
          chassis: 'Good',
          hinges: 'Good',
          ports: 'Good',
          webcam: 'Good',
          speakers: 'Good',
          charger: 'Good',
        },
        diagnosticChecks: {
          bootTest: 'Passed',
          displayTest: 'Passed',
          keyboardTest: 'Passed',
          batteryHealth: 'Passed',
          storageHealth: 'Passed',
          ramTest: 'Passed',
          cpuTest: 'Passed',
          wifi: 'Passed',
          bluetooth: 'Passed',
          camera: 'Passed',
          usbPorts: 'Passed',
        },
        notes: '',
        lifecycleStage: 'Received',
      }
      setAssets((prev) => [asset, ...prev])
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: 'registered incoming asset',
        assetId: id,
      })
      setNotifications((prev) => [
        {
          id: `N-${Date.now()}`,
          title: 'Asset registered',
          body: `${id} is in the intake queue and awaiting assessment.`,
          time: now,
          read: false,
          tone: 'info',
        },
        ...prev,
      ])
      return asset
    },
    [addAudit, assets],
  )

  const saveAssessment = useCallback(
    (id: string, update: AssessmentUpdate) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        ...update,
        physicalCondition: update.physicalCondition || scoreToCondition(update.conditionScore),
        assessor: 'Leo Gem',
        lifecycleStage: update.assessmentStatus === 'Completed' ? 'Assessed' : 'Received',
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action:
          update.assessmentStatus === 'Completed'
            ? 'completed assessment'
            : 'saved assessment progress',
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const startSanitization = useCallback(
    (id: string, method: NonNullable<Asset['sanitizationMethod']>) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        sanitizationMethod: method,
        sanitizationStatus: 'In Progress',
        sanitizationOperator: 'Leo Gem',
        sanitizationStarted: now,
        sanitizationCompleted: null,
        verification: 'Pending',
        sanitizationStep: 3,
        certificateId: null,
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: `started ${method}`,
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const completeSanitization = useCallback(
    (id: string, passed: boolean) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        sanitizationStatus: passed ? 'Completed' : 'Failed',
        sanitizationCompleted: now,
        verification: passed ? 'Passed' : 'Failed',
        sanitizationStep: passed ? 6 : 5,
        certificateId: passed ? `SAN-2026-${id.replace('AST-', '')}` : null,
        lifecycleStage: passed ? 'Sanitized' : 'Assessed',
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: passed
          ? 'completed sanitization verification'
          : 'failed sanitization verification',
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const approveDisposition = useCallback(
    (id: string, path: DispositionPath) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        disposition: path,
        approval: 'Approved',
        dispositionStatus: 'Ready',
        lifecycleStage: 'Dispositioned',
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: `approved disposition — ${path}`,
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const requestReview = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        approval: 'Review Requested',
        dispositionStatus: 'Processing',
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: 'requested disposition review',
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const rejectDisposition = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      updateAsset(id, {
        approval: 'Rejected',
        dispositionStatus: 'Rejected',
      })
      addAudit({
        timestamp: now,
        actor: 'Leo Gem',
        action: 'rejected proposed disposition',
        assetId: id,
      })
    },
    [addAudit, updateAsset],
  )

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const value = useMemo(
    () => ({
      assets,
      auditLog,
      notifications,
      theme,
      sidebarOpen,
      setSidebarOpen,
      toggleTheme,
      registerAsset,
      updateAsset,
      saveAssessment,
      startSanitization,
      completeSanitization,
      approveDisposition,
      requestReview,
      rejectDisposition,
      addAudit,
      markNotificationsRead,
    }),
    [
      assets,
      auditLog,
      notifications,
      theme,
      sidebarOpen,
      toggleTheme,
      registerAsset,
      updateAsset,
      saveAssessment,
      startSanitization,
      completeSanitization,
      approveDisposition,
      requestReview,
      rejectDisposition,
      addAudit,
      markNotificationsRead,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider')
  }
  return ctx
}
