import {
  Banknote,
  CircleAlert,
  Laptop,
  Plus,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { RegisterAssetDialog } from '@/components/dashboard/RegisterAssetDialog'
import { AlertCard } from '@/components/shared/AlertCard'
import { AssetTable } from '@/components/shared/AssetTable'
import { ChartCard } from '@/components/shared/ChartCard'
import { ChartSkeleton, StatSkeleton, TableSkeleton } from '@/components/shared/LoadingState'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { useApp } from '@/context/AppContext'
import { fleetCondition, lifecycleSeries } from '@/data/mockAssets'
import { usePageLoading } from '@/hooks/usePageLoading'
import { relativeTime } from '@/lib/utils'
import type { Condition } from '@/types/asset'

const ranges = [
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
  { id: '90d', label: '90 Days' },
  { id: '12m', label: '12 Months' },
] as const

const conditionColors: Record<Condition, string> = {
  Excellent: '#059669',
  Good: '#2563eb',
  Fair: '#d97706',
  Poor: '#dc2626',
  Scrap: '#737373',
}

export function Dashboard() {
  const { assets } = useApp()
  const navigate = useNavigate()
  const loading = usePageLoading()
  const [range, setRange] = useState<(typeof ranges)[number]['id']>('30d')
  const [registerOpen, setRegisterOpen] = useState(false)


  const conditionData = fleetCondition

  const recent = [...assets].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)).slice(0, 6)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-5">
          <ChartSkeleton className="xl:col-span-3" />
          <ChartSkeleton className="xl:col-span-2" />
        </div>
        <TableSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight">Asset Recovery Overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Monitor incoming assets, assessment progress, sanitization status and final disposition.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/reports')}>
            Export Report
          </Button>
          <Button onClick={() => setRegisterOpen(true)}>
            <Plus /> Register Asset
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Assets" value={1284} hint="+12.4% this month" icon={Laptop} />
        <StatCard label="Awaiting Assessment" value={86} hint="Requires attention" tone="warning" icon={CircleAlert} />
        <StatCard label="Sanitization Complete" value={1043} hint="81.2%" tone="success" icon={ShieldCheck} />
        <StatCard label="Ready for Disposition" value={94} hint="Processing queue" tone="info" icon={Workflow} />
        <StatCard label="Recovered Value" value="KES 8.42M" hint="Estimated resale value" icon={Banknote} />
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        <ChartCard
          title="Asset Lifecycle"
          className="xl:col-span-3"
          action={
            <div className="flex rounded-xl border border-border p-0.5">
              {ranges.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRange(item.id)}
                  className={`rounded-lg px-2.5 py-1 text-[12px] ${range === item.id ? 'bg-muted font-medium' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lifecycleSeries[range]} barSize={28}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="stage"
                  interval={0}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--muted)' }}
                  contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }}
                />
                <Bar dataKey="value" fill="var(--foreground)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Condition Distribution" className="xl:col-span-2">
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={conditionData} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={2}>
                  {conditionData.map((entry) => (
                    <Cell key={entry.name} fill={conditionColors[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-xl font-semibold">1,284</p>
              <p className="text-xs text-muted-foreground">Assets</p>
            </div>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {conditionData.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span className="size-2 rounded-full" style={{ background: conditionColors[item.name] }} />
                  {item.name}
                </span>
                <span className="tabular-nums">{item.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Recently Processed Assets</h2>
        <AssetTable
          rows={recent}
          rowKey={(row) => row.id}
          onRowClick={(row) => navigate(`/assessments?asset=${row.id}`)}
          emptyAction={() => setRegisterOpen(true)}
          columns={[
            { key: 'id', header: 'Asset ID', className: 'whitespace-nowrap', render: (row) => <span className="font-mono text-[13px]">{row.id}</span> },
            { key: 'device', header: 'Device', render: (row) => row.device },
            { key: 'serial', header: 'Serial Number', render: (row) => <span className="font-mono text-[13px]">{row.serialNumber}</span> },
            { key: 'condition', header: 'Condition', render: (row) => <StatusBadge value={row.physicalCondition} /> },
            {
              key: 'sanitization',
              header: 'Sanitization',
              render: (row) => <StatusBadge value={row.verification === 'Passed' ? 'Verified' : row.sanitizationStatus} />,
            },
            { key: 'disposition', header: 'Disposition', render: (row) => <StatusBadge value={row.disposition ?? 'Queued'} /> },
            { key: 'updated', header: 'Updated', render: (row) => <span className="text-muted-foreground">{relativeTime(row.updatedAt)}</span> },
          ]}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">Requires Attention</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <AlertCard title="assets failed sanitization verification" count={12} tone="critical" onClick={() => navigate('/sanitization?filter=Failed')} />
          <AlertCard title="assets missing serial-number verification" count={8} tone="warning" onClick={() => navigate('/assessments?q=serial')} />
          <AlertCard title="assets awaiting physical assessment" count={5} tone="warning" onClick={() => navigate('/assessments?status=Pending')} />
          <AlertCard title="assets have unresolved diagnostic errors" count={3} tone="info" onClick={() => navigate('/assessments?status=In Progress')} />
        </div>
      </section>

      <RegisterAssetDialog open={registerOpen} onOpenChange={setRegisterOpen} />
    </div>
  )
}
