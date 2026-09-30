export type Manufacturer = 'Dell' | 'Lenovo' | 'HP' | 'Apple' | 'ASUS'

export type PhysicalGrade = 'Good' | 'Fair' | 'Damaged' | 'Missing'

export type DiagnosticResult = 'Passed' | 'Warning' | 'Failed'

export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Scrap'

export type AssessmentStatus = 'Pending' | 'In Progress' | 'Completed'

export type SanitizationStatus = 'Not Started' | 'Pending' | 'In Progress' | 'Completed' | 'Failed'

export type VerificationStatus = 'Not Started' | 'Pending' | 'Passed' | 'Failed'

export type SanitizationMethod =
  | 'Secure Erase'
  | 'Cryptographic Erase'
  | 'NIST 800-88 Clear'
  | 'NIST 800-88 Purge'
  | 'Physical Destruction'

export type DispositionPath = 'Redeploy' | 'Refurbish' | 'Resale' | 'Donate' | 'Recycle' | 'Destroy'

export type ApprovalStatus = 'Pending' | 'Approved' | 'Rejected' | 'Review Requested'

export type DispositionStatus = 'Queued' | 'Ready' | 'Processing' | 'Completed' | 'Rejected'

export type LifecycleStage = 'Received' | 'Assessed' | 'Sanitized' | 'Refurbishment' | 'Dispositioned'

export type TechnicalCondition = 'Passed' | 'Warning' | 'Failed'

export interface PhysicalAssessment {
  screen: PhysicalGrade
  keyboard: PhysicalGrade
  trackpad: PhysicalGrade
  chassis: PhysicalGrade
  hinges: PhysicalGrade
  ports: PhysicalGrade
  webcam: PhysicalGrade
  speakers: PhysicalGrade
  charger: PhysicalGrade
}

export interface TechnicalAssessment {
  bootTest: DiagnosticResult
  displayTest: DiagnosticResult
  keyboardTest: DiagnosticResult
  batteryHealth: DiagnosticResult
  storageHealth: DiagnosticResult
  ramTest: DiagnosticResult
  cpuTest: DiagnosticResult
  wifi: DiagnosticResult
  bluetooth: DiagnosticResult
  camera: DiagnosticResult
  usbPorts: DiagnosticResult
}

export interface Asset {
  id: string
  device: string
  manufacturer: Manufacturer
  model: string
  serialNumber: string
  assetTag: string
  processor: string
  ram: string
  storage: string
  os: string
  purchaseYear: number
  location: string
  physicalCondition: Condition
  technicalCondition: TechnicalCondition
  conditionScore: number
  recommendedAction: string
  recommendedPath: DispositionPath
  assessor: string
  assessmentStatus: AssessmentStatus
  sanitizationMethod: SanitizationMethod | null
  sanitizationStatus: SanitizationStatus
  sanitizationOperator: string | null
  sanitizationStarted: string | null
  sanitizationCompleted: string | null
  verification: VerificationStatus
  certificateId: string | null
  sanitizationStep: number
  disposition: DispositionPath | null
  estimatedValue: number
  refurbishmentCost: number
  approval: ApprovalStatus
  dispositionStatus: DispositionStatus
  updatedAt: string
  receivedAt: string
  physicalChecks: PhysicalAssessment
  diagnosticChecks: TechnicalAssessment
  notes: string
  lifecycleStage: LifecycleStage
}

export interface AuditEvent {
  id: string
  timestamp: string
  actor: string
  action: string
  assetId: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  tone: 'warning' | 'info' | 'success' | 'critical'
}

export const PHYSICAL_CHECK_LABELS: Record<keyof PhysicalAssessment, string> = {
  screen: 'Screen',
  keyboard: 'Keyboard',
  trackpad: 'Trackpad',
  chassis: 'Chassis',
  hinges: 'Hinges',
  ports: 'Ports',
  webcam: 'Webcam',
  speakers: 'Speakers',
  charger: 'Charger',
}

export const DIAGNOSTIC_CHECK_LABELS: Record<keyof TechnicalAssessment, string> = {
  bootTest: 'Boot test',
  displayTest: 'Display test',
  keyboardTest: 'Keyboard test',
  batteryHealth: 'Battery health',
  storageHealth: 'Storage health',
  ramTest: 'RAM test',
  cpuTest: 'CPU test',
  wifi: 'Wi-Fi',
  bluetooth: 'Bluetooth',
  camera: 'Camera',
  usbPorts: 'USB ports',
}

export const PHYSICAL_GRADES: PhysicalGrade[] = ['Good', 'Fair', 'Damaged', 'Missing']

export const SANITIZATION_STEPS = [
  'Device Identified',
  'Storage Detected',
  'Sanitization Started',
  'Sanitization Completed',
  'Verification',
  'Certificate Generated',
] as const
