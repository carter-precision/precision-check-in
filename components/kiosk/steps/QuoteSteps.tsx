import { ShieldCheck, Wrench } from 'lucide-react'

import { ChoiceButton, KioskStep } from '../KioskPrimitives'
import {
  emptyQuoteContactData,
  emptyQuoteServiceData,
  emptyQuoteVehicleData,
  type KioskStepProps,
} from '../types'

export function QuoteServiceTypeStep({ goTo }: KioskStepProps) {
  return (
    <KioskStep title="What do you need a quote for?">
      <div className="grid gap-4">
        <ChoiceButton
          icon={<ShieldCheck />}
          label="Windshield"
          description="Start a windshield quote."
          onClick={() =>
            goTo('windshieldVehicle', {
              ...emptyQuoteServiceData,
              ...emptyQuoteVehicleData,
              ...emptyQuoteContactData,
              quoteSource: 'header',
              serviceType: 'windshield',
              windshieldIntent: 'quote',
            })
          }
        />
        <ChoiceButton
          icon={<Wrench />}
          label="Rock chip"
          description="Schedule a rock chip repair."
          onClick={() =>
            goTo('paymentType', {
              ...emptyQuoteServiceData,
              ...emptyQuoteContactData,
              quoteSource: 'header',
              serviceType: 'rock_chip',
              paymentType: null,
            })
          }
        />
      </div>
    </KioskStep>
  )
}
