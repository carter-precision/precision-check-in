import { KioskStep } from '@/components/kiosk/KioskPrimitives'
import type { KioskStepProps } from '@/components/kiosk/types'

import { getLegacyOmegaQuoteUrl } from './omega-quote'

export function LegacyWindshieldInsuranceQuoteStep({
  location,
}: KioskStepProps) {
  return (
    <KioskStep>
      <div className="mb-10 h-[85vh] overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white pb-4 pr-4 pt-4 shadow-sm">
        <iframe
          title="Insurance windshield quote"
          src={getLegacyOmegaQuoteUrl({ location, type: 'insurance' })}
          className="h-full w-full"
        />
      </div>
    </KioskStep>
  )
}

export function LegacyWindshieldCashQuoteStep({ location }: KioskStepProps) {
  return (
    <KioskStep>
      <div className="mb-10 flex h-[92vh] flex-col items-center overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white pb-4 pr-4 pt-8 shadow-sm">
        <h3 className="text-3xl font-bold leading-snug text-[#16262f]">
          Windshield Quote
        </h3>
        <iframe
          title="Cash windshield quote"
          src={getLegacyOmegaQuoteUrl({ location, type: 'cash' })}
          className="h-full w-full"
        />
      </div>
    </KioskStep>
  )
}

export function LegacyRockChipQuoteStep({ location }: KioskStepProps) {
  return (
    <KioskStep>
      <div className="mb-10 flex h-[92vh] flex-col items-center overflow-hidden rounded-[1.4rem] border border-[#d7e1e3] bg-white pb-4 pr-4 pt-8 shadow-sm">
        <h3 className="text-3xl font-bold leading-snug text-[#16262f]">
          Rock Chip Quote
        </h3>
        <iframe
          title="Rock chip quote"
          src={getLegacyOmegaQuoteUrl({ location, type: 'rock-chip' })}
          className="h-full w-full"
        />
      </div>
    </KioskStep>
  )
}
