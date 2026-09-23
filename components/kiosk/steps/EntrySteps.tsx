import {
  CalendarCheck,
  Car,
  CircleHelp,
  CreditCard,
  KeyRound,
  ShieldCheck,
  Wrench,
} from 'lucide-react'

import { ChoiceButton, ChoiceCard, KioskStep } from '../KioskPrimitives'
import type { KioskStepProps } from '../types'

export function AppointmentStep({ goTo }: KioskStepProps) {
  return (
    <KioskStep title="Select an option to get started">
      <div className="grid grid-cols-3 gap-4 pb-28 pt-5">
        <ChoiceCard
          icon={<CalendarCheck strokeWidth={1.3} />}
          label="Appointment"
          onClick={() =>
            goTo('name', {
              visitType: 'appointment',
              serviceType: null,
              paymentType: null,
            })
          }
        />

        <ChoiceCard
          icon={<Car strokeWidth={1.3} className="scale-115" />}
          label="Walk-in"
          onClick={() =>
            goTo('serviceType', {
              visitType: 'walk_in',
              serviceType: null,
              paymentType: null,
            })
          }
        />

        <ChoiceCard
          icon={<KeyRound strokeWidth={1.3} />}
          label="Vehicle Pickup"
          onClick={() =>
            goTo('name', {
              visitType: 'vehicle_pickup',
              serviceType: null,
              paymentType: null,
            })
          }
        />
      </div>
    </KioskStep>
  )
}

export function ServiceTypeStep({ goTo }: KioskStepProps) {
  return (
    <KioskStep title="How can we help?">
      <div className="grid gap-4">
        <ChoiceButton
          icon={<ShieldCheck />}
          label="Windshield"
          description="For windshield service or replacement."
          onClick={() =>
            goTo('windshieldIntent', {
              quoteSource: 'walk_in',
              serviceType: 'windshield',
              paymentType: null,
            })
          }
        />
        <ChoiceButton
          icon={<Wrench />}
          label="Rock chip"
          description="Repair for small chips or cracks."
          onClick={() =>
            goTo('paymentType', {
              serviceType: 'rock_chip',
              paymentType: null,
            })
          }
        />
        <ChoiceButton
          icon={<CircleHelp />}
          label="Something else"
          description="A technician will help sort it out."
          onClick={() =>
            goTo('name', {
              serviceType: 'other',
              paymentType: null,
            })
          }
        />
      </div>
    </KioskStep>
  )
}

export function PaymentTypeStep({ goTo }: KioskStepProps) {
  return (
    <KioskStep title="How would you like to pay?">
      <div className="grid gap-4">
        <ChoiceButton
          icon={<CreditCard />}
          label="Cash pay"
          description="You'll pay directly for the repair."
          trailing={
            <div className="-mt-1 text-3xl font-bold tracking-tight text-accent">
              $79.99
            </div>
          }
          onClick={() =>
            goTo('rockChipCashAuthorization', {
              paymentType: 'cash',
              repairAuthorized: false,
            })
          }
        />
        <ChoiceButton
          icon={<ShieldCheck />}
          label="Insurance"
          description="Often covered at no cost."
          onClick={() =>
            goTo('rockChipInsuranceName', {
              paymentType: 'insurance',
              repairAuthorized: false,
            })
          }
        />
      </div>
    </KioskStep>
  )
}
