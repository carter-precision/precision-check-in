import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProdPreview } from '@/components/prod-preview/ProdPreview'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Production Preview',
  description: 'Preview common Precision Auto Glass application states.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ProdPreviewPage() {
  if (process.env.DISABLE_PREVIEW?.trim().toLowerCase() === 'true') {
    notFound()
  }

  return <ProdPreview />
}
