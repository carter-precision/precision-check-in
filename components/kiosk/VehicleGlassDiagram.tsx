import type { KeyboardEvent, ReactNode } from 'react'
import { CircleQuestionMark } from 'lucide-react'
import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

import type { GlassType } from './types'

export function VehicleGlassDiagram({
  selected,
  onSelect,
  selectionControl,
}: {
  selected: GlassType | null
  onSelect: (glass: GlassType) => void
  selectionControl: ReactNode
}) {
  const cardSelection = getCardSelection(selected)

  function interactionProps(glass: GlassType, label: string) {
    const isSelected = selected === glass

    return {
      role: 'button',
      tabIndex: 0,
      'aria-label': label,
      'aria-pressed': isSelected,
      className: glassClasses(isSelected),
      onClick: () => onSelect(glass),
      onKeyDown: (event: KeyboardEvent<SVGElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(glass)
        }
      },
    }
  }

  return (
    <div className="rounded-[1.4rem] border border-[#d7e1e3] bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,20.7rem)]">
        <svg
          viewBox="0 0 420 700"
          className="mx-auto max-h-[58vh] w-full max-w-90 sm:mr-auto sm:ml-3"
          aria-label="Top view of vehicle glass panels"
        >
          <defs>
            <linearGradient id="vehicle-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#f8fbfb" />
              <stop offset="1" stopColor="#e4eff1" />
            </linearGradient>
            <filter
              id="vehicle-shadow"
              x="-20%"
              y="-100%"
              width="140%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="7" />
            </filter>
          </defs>

          <g>
            <ellipse
              cx="210"
              cy="677"
              rx="132"
              ry="12"
              className="fill-[#9fb4b9]/35"
              filter="url(#vehicle-shadow)"
            />

            <rect
              className="fill-[#16262f]"
              x="57"
              y="130"
              width="30"
              height="80"
              rx="14"
            />
            <rect
              className="fill-[#16262f]"
              x="333"
              y="130"
              width="30"
              height="80"
              rx="14"
            />
            <rect
              className="fill-[#16262f]"
              x="57"
              y="467"
              width="30"
              height="82"
              rx="14"
            />
            <rect
              className="fill-[#16262f]"
              x="333"
              y="467"
              width="30"
              height="82"
              rx="14"
            />

            <path
              d="M210 18 C145 18 104 31 88 68 C82 83 80 101 80 123 L80 575 C80 642 123 679 210 682 C297 679 340 642 340 575 L340 123 C340 101 338 83 332 68 C316 31 275 18 210 18 Z"
              fill="url(#vehicle-body)"
              className="stroke-[#2f6975] stroke-[2.5]"
            />

            <path
              d="M118 51 C145 35 176 30 210 30 C244 30 275 35 302 51 C320 72 326 96 326 127 L326 570 C326 624 287 657 210 662 C133 657 94 624 94 570 L94 127 C94 96 100 72 118 51 Z"
              className="fill-none stroke-white/80 stroke-7"
            />

            <path
              d="M80 193 L56 205 Q47 210 50 219 L53 227 Q56 233 64 229 L80 219 Z"
              className="fill-[#f5fafb] stroke-[#2f6975] stroke-2"
            />
            <path
              d="M340 193 L364 205 Q373 210 370 219 L367 227 Q364 233 356 229 L340 219 Z"
              className="fill-[#f5fafb] stroke-[#2f6975] stroke-2"
            />

            <path
              {...interactionProps('windshield', 'Windshield')}
              d="M112 150 Q210 121 308 150 Q318 153 314 168 L294 230 Q290 243 278 239 Q210 225 142 239 Q130 243 126 230 L106 168 Q102 153 112 150 Z"
            />

            <path
              {...interactionProps('driver_front', 'Driver front window')}
              d="M96 216 Q102 209 109 222 Q132 263 133 303 L133 345 Q133 347 131 347 H96 Q94 347 94 345 L94 235 Q94 220 96 216 Z"
            />
            <path
              {...interactionProps('passenger_front', 'Passenger front window')}
              d="M324 216 Q318 209 311 222 Q288 263 287 303 L287 345 Q287 347 289 347 H324 Q326 347 326 345 L326 235 Q326 220 324 216 Z"
            />

            <rect
              {...interactionProps('sunroof', 'Sunroof')}
              x="166"
              y="291"
              width="88"
              height="121"
              rx="18"
              transform="rotate(90 210 351.5)"
            />

            <path
              {...interactionProps('driver_rear', 'Driver rear window')}
              d="M96 357 H131 Q133 357 133 359 L132 431 Q130 454 108 479 Q100 489 97 478 Q93 459 94 438 L94 359 Q94 357 96 357 Z"
            />
            <path
              {...interactionProps('passenger_rear', 'Passenger rear window')}
              d="M324 357 H289 Q287 357 287 359 L288 431 Q290 454 312 479 Q320 489 323 478 Q327 459 326 438 L326 359 Q326 357 324 357 Z"
            />

            <path
              {...interactionProps('back', 'Back glass')}
              d="M143 473 Q210 486 277 473 Q289 471 292 483 L307 552 Q309 565 298 571 Q210 600 122 571 Q111 565 113 552 L128 483 Q131 471 143 473 Z"
            />
          </g>
        </svg>

        <div className="m-2 flex flex-col gap-5">
          <ToggleGroupPrimitive.Root
            type="single"
            value={cardSelection}
            aria-label="Additional glass options"
            className="grid grid-cols-3 gap-5 sm:flex-1 sm:grid-cols-1 sm:grid-rows-3"
            onValueChange={(value) => {
              if (value) onSelect(value as GlassType)
            }}
          >
            <GlassOptionCard
              value="quarter"
              label="Quarter glass"
              selected={cardSelection === 'quarter'}
              visual={
                <QuarterGlassVisual selected={cardSelection === 'quarter'} />
              }
            />
            <GlassOptionCard
              value="vent"
              label="Vent glass"
              selected={cardSelection === 'vent'}
              visual={<VentGlassVisual selected={cardSelection === 'vent'} />}
            />
            <GlassOptionCard
              value="other"
              label="Not sure or multiple pieces"
              selected={cardSelection === 'other'}
              visual={
                <CircleQuestionMark
                  strokeWidth={1}
                  className={cn(
                    'size-14',
                    cardSelection === 'other'
                      ? 'text-accent-shade'
                      : 'text-[#2f6975]',
                  )}
                />
              }
            />
          </ToggleGroupPrimitive.Root>
          {selectionControl}
        </div>
      </div>
    </div>
  )
}

function GlassOptionCard({
  value,
  label,
  selected,
  visual,
}: {
  value: 'quarter' | 'vent' | 'other'
  label: string
  selected: boolean
  visual: React.ReactNode
}) {
  return (
    <ToggleGroupPrimitive.Item
      value={value}
      aria-label={label}
      className={cn(
        'flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center text-sm font-bold shadow-sm outline-none transition focus-visible:ring-3 focus-visible:ring-ring/50 sm:min-h-0',
        selected
          ? 'border-accent bg-accent-tint text-accent shadow-md'
          : 'border-border bg-card text-muted-foreground hover:border-accent/60 hover:bg-accent-tint/50 hover:text-foreground',
      )}
    >
      {visual}
      <span>{label}</span>
    </ToggleGroupPrimitive.Item>
  )
}

function QuarterGlassVisual({ selected }: { selected: boolean }) {
  return (
    <svg
      viewBox="0 0 120 72"
      className="h-14 w-full max-w-28"
      aria-hidden="true"
    >
      <path
        d="M15 5 C57 12 103 34 107 63 Q107 67 103 67 H15 Q13 67 13 65 V7 Q13 5 15 5 Z"
        className={miniGlassClasses(selected)}
        strokeLinejoin="round"
      />
    </svg>
  )
}

function VentGlassVisual({ selected }: { selected: boolean }) {
  return (
    <svg
      viewBox="0 0 132 72"
      className="h-14 w-full max-w-28 overflow-visible"
      aria-hidden="true"
    >
      <path
        d="M3 64 C15 39 32 20 46 10 Q48 9 48 12 V64 Q48 66 46 66 H4 Q2 66 3 64 Z"
        className={miniGlassClasses(selected)}
        strokeLinejoin="round"
        transform="translate(-13 0)"
      />
      <line
        x1="76"
        y1="4"
        x2="65"
        y2="68"
        className={miniGlassStrokeClasses(selected)}
        strokeLinecap="round"
      />
      <rect
        x="103"
        y="10"
        width="37"
        height="56"
        rx="2"
        className={miniGlassClasses(selected)}
      />
    </svg>
  )
}

function getCardSelection(selected: GlassType | null) {
  if (
    selected === 'quarter' ||
    selected === 'driver_quarter' ||
    selected === 'passenger_quarter'
  ) {
    return 'quarter'
  }

  return selected === 'vent' || selected === 'other' ? selected : ''
}

function glassClasses(selected: boolean) {
  return selected
    ? 'cursor-pointer fill-accent stroke-accent-shade stroke-[2.5] outline-none'
    : 'cursor-pointer fill-[#f8fbfb] stroke-[#2f6975] stroke-[2.5] outline-none transition hover:fill-accent-tint focus:fill-accent-tint'
}

function miniGlassClasses(selected: boolean) {
  return selected
    ? 'fill-accent stroke-accent-shade stroke-[2.5]'
    : 'fill-[#f8fbfb] stroke-[#2f6975] stroke-[2.5]'
}

function miniGlassStrokeClasses(selected: boolean) {
  return selected
    ? 'fill-none stroke-accent-shade stroke-[2.5]'
    : 'fill-none stroke-[#2f6975] stroke-[2.5]'
}
