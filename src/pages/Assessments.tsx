import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AssessmentDetail } from '@/components/assessments/AssessmentDetail'
import { RegisterAssetDialog } from '@/components/dashboard/RegisterAssetDialog'
import { AssetTable } from '@/components/shared/AssetTable'
import { FilterDropdown } from '@/components/shared/FilterDropdown'
import { TableSkeleton } from '@/components/shared/LoadingState'
import { SearchBar } from '@/components/shared/SearchBar'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { assessors, locations } from '@/data/mockAssets'
import { usePageLoading } from '@/hooks/usePageLoading'
import { relativeTime } from '@/lib/utils'

export function Assessments() {
  const { assets } = useApp()
  const loading = usePageLoading()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? 'all')
  const [manufacturer, setManufacturer] = useState('all')
  const [condition, setCondition] = useState('all')
  const [assessor, setAssessor] = useState('all')
  const [date, setDate] = useState('all')
  const [location, setLocation] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(params.get('asset'))
  const [registerOpen, setRegisterOpen] = useState(false)
  const selected = assets.find((asset) => asset.id === selectedId) ?? null

  useEffect(() => {
    const q = params.get('q')
    const nextStatus = params.get('status')
    const asset = params.get('asset')
    if (q !== null) setQuery(q)
    if (nextStatus) setStatus(nextStatus)
    if (asset) setSelectedId(asset)
  }, [params])

  const filtered = useMemo(() => {
    return assets.filter((asset) => {
      const q = query.toLowerCase()
      const matchesQuery =
        !q ||
        asset.id.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.device.toLowerCase().includes(q) ||
        asset.notes.toLowerCase().includes(q)
      const matchesStatus = status === 'all' || asset.assessmentStatus === status
      const matchesMfr = manufacturer === 'all' || asset.manufacturer === manufacturer
      const matchesCond = condition === 'all' || asset.physicalCondition === condition
      const matchesAssessor = assessor === 'all' || asset.assessor === assessor
      const matchesLoc = location === 'all' || asset.location === location
      const matchesDate =
        date === 'all' ||
        (date === 'Today' && new Date(asset.updatedAt).toDateString() === new Date().toDateString()) ||
        (date === 'This week' && Date.now() - new Date(asset.updatedAt).getTime() < 7 * 86400000)
      return matchesQuery && matchesStatus && matchesMfr && matchesCond && matchesAssessor && matchesLoc && matchesDate
    })
  }, [assets, assessor, condition, date, location, manufacturer, query, status])

  if (loading) {
    return (
      <div className="space-y-6">
        <TableSkeleton cols={8} rows={8} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">Asset Assessment</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Evaluate device condition, functionality and recovery potential.
          </p>
        </div>
        <Button onClick={() => setRegisterOpen(true)}>
          <Plus /> New Assessment
        </Button>
      </div>

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search asset ID, serial number or device..."
      />

      <div className="flex flex-wrap gap-2">
        <FilterDropdown label="Status" value={status} onChange={setStatus} options={['Pending', 'In Progress', 'Completed']} />
        <FilterDropdown label="Manufacturer" value={manufacturer} onChange={setManufacturer} options={['Dell', 'Lenovo', 'HP', 'Apple', 'ASUS']} />
        <FilterDropdown label="Condition" value={condition} onChange={setCondition} options={['Excellent', 'Good', 'Fair', 'Poor', 'Scrap']} />
        <FilterDropdown label="Assessor" value={assessor} onChange={setAssessor} options={assessors} />
        <FilterDropdown label="Date" value={date} onChange={setDate} options={['Today', 'This week']} />
        <FilterDropdown label="Location" value={location} onChange={setLocation} options={locations} />
      </div>

      <AssetTable
        rows={filtered}
        rowKey={(row) => row.id}
        onRowClick={(row) => setSelectedId(row.id)}
        emptyAction={() => setRegisterOpen(true)}
        columns={[
          { key: 'id', header: 'Asset ID', className: 'whitespace-nowrap', render: (row) => <span className="font-mono text-[13px]">{row.id}</span> },
          { key: 'device', header: 'Device', render: (row) => row.device },
          { key: 'serial', header: 'Serial Number', render: (row) => <span className="font-mono text-[13px]">{row.serialNumber}</span> },
          { key: 'mfr', header: 'Manufacturer', render: (row) => row.manufacturer },
          { key: 'physical', header: 'Physical Condition', render: (row) => <StatusBadge value={row.physicalCondition} /> },
          { key: 'tech', header: 'Technical Condition', render: (row) => <StatusBadge value={row.technicalCondition} /> },
          { key: 'assessor', header: 'Assessor', render: (row) => row.assessor || '—' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.assessmentStatus} /> },
          { key: 'updated', header: 'Last Updated', render: (row) => relativeTime(row.updatedAt) },
          {
            key: 'action',
            header: 'Action',
            render: (row) => (
              <button type="button" className="text-sm font-medium underline-offset-2 hover:underline" onClick={() => setSelectedId(row.id)}>
                View
              </button>
            ),
          },
        ]}
      />

      <AssessmentDetail asset={selected} open={!!selected} onOpenChange={(open) => !open && setSelectedId(null)} />
      <RegisterAssetDialog open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  )
}
