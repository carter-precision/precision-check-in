'use client'

import { useState } from 'react'
import {
  ClipboardCheck,
  LayoutDashboard,
  MonitorSmartphone,
} from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import {
  CheckInPreview,
  checkInPreviewOptions,
  type CheckInPreviewState,
} from './CheckInPreview'
import {
  DashboardPreview,
  dashboardPreviewOptions,
  type DashboardPreviewState,
} from './DashboardPreview'
import {
  KioskPreview,
  kioskPreviewOptions,
  type KioskPreviewState,
} from './KioskPreview'

type PreviewPage = 'kiosk' | 'dashboard' | 'check-in'

export function ProdPreview() {
  const [page, setPage] = useState<PreviewPage>('kiosk')
  const [kioskState, setKioskState] =
    useState<KioskPreviewState>('windshield-vehicle')
  const [dashboardState, setDashboardState] =
    useState<DashboardPreviewState>('mixed')
  const [checkInState, setCheckInState] =
    useState<CheckInPreviewState>('resolved')

  return (
    <main className="min-h-dvh bg-muted/40 px-4 pb-6 pt-20 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-screen-2xl">
        <Tabs
          value={page}
          onValueChange={(value) => setPage(value as PreviewPage)}
          className="gap-0"
        >
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="flex flex-col gap-4 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList
                variant="line"
                className="grid h-auto w-full grid-cols-3 sm:w-fit"
              >
                <TabsTrigger value="kiosk" className="h-10 px-4">
                  <MonitorSmartphone data-icon="inline-start" />
                  Kiosk
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="h-10 px-4">
                  <LayoutDashboard data-icon="inline-start" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="check-in" className="h-10 px-4">
                  <ClipboardCheck data-icon="inline-start" />
                  Check-in
                </TabsTrigger>
              </TabsList>

              {page === 'kiosk' && (
                <StateSelect
                  id="kiosk-preview-state"
                  value={kioskState}
                  options={kioskPreviewOptions}
                  onValueChange={(value) =>
                    setKioskState(value as KioskPreviewState)
                  }
                />
              )}
              {page === 'dashboard' && (
                <StateSelect
                  id="dashboard-preview-state"
                  value={dashboardState}
                  options={dashboardPreviewOptions}
                  onValueChange={(value) =>
                    setDashboardState(value as DashboardPreviewState)
                  }
                />
              )}
              {page === 'check-in' && (
                <StateSelect
                  id="check-in-preview-state"
                  value={checkInState}
                  options={checkInPreviewOptions}
                  onValueChange={(value) =>
                    setCheckInState(value as CheckInPreviewState)
                  }
                />
              )}
            </CardHeader>

            <CardContent className="p-0">
              <TabsContent value="kiosk">
                <KioskPreview
                  key={kioskState}
                  state={kioskState}
                  onStateChange={setKioskState}
                />
              </TabsContent>

              <TabsContent value="dashboard">
                <DashboardPreview key={dashboardState} state={dashboardState} />
              </TabsContent>

              <TabsContent value="check-in">
                <CheckInPreview key={checkInState} state={checkInState} />
              </TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </main>
  )
}

function StateSelect({
  id,
  value,
  options,
  onValueChange,
}: {
  id: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onValueChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <Label htmlFor={id}>State</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="w-56 max-w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="end">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
