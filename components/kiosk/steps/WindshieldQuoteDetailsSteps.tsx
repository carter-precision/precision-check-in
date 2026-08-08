import { useEffect, useRef, useState } from 'react'

import type {
  VehicleMakeOption,
  VehicleModelOption,
  VehicleVariantOption,
  VehicleYearOption,
  VinVehicleResult,
} from '@/lib/omega/quote-types'

import {
  QuoteContinueButton,
  QuoteField,
  QuoteForm,
  QuoteHelperButton,
  QuoteInput,
  QuoteSelect,
} from '../QuoteForm'
import {
  KioskOmegaLookupError,
  loadVehicleByVin,
  loadVehicleMakes,
  loadVehicleModels,
  loadVehicleVariants,
  loadVehicleYears,
} from '../omega-quote-lookups'
import type { KioskData, KioskStepProps, QuoteVehicle } from '../types'
import { KioskStep } from '../KioskPrimitives'

export function WindshieldVehicleStep({
  data,
  updateData,
  goTo,
  location,
}: KioskStepProps) {
  const [years, setYears] = useState<VehicleYearOption[]>([])
  const [makes, setMakes] = useState<VehicleMakeOption[]>([])
  const [models, setModels] = useState<VehicleModelOption[]>([])
  const [variants, setVariants] = useState<VehicleVariantOption[]>([])
  const [yearsStatus, setYearsStatus] = useState<LookupStatus>(
    data.vinUnknown ? 'loading' : 'idle',
  )
  const [makesStatus, setMakesStatus] = useState<LookupStatus>(
    data.vinUnknown && data.vehicleYear ? 'loading' : 'idle',
  )
  const [modelsStatus, setModelsStatus] = useState<LookupStatus>(
    data.vinUnknown && data.vehicleMakeId ? 'loading' : 'idle',
  )
  const [variantsStatus, setVariantsStatus] = useState<LookupStatus>(
    data.vinUnknown && data.vehicleModelId ? 'loading' : 'idle',
  )
  const [vinStatus, setVinStatus] = useState<LookupStatus>('idle')
  const [yearsRetry, setYearsRetry] = useState(0)
  const [makesRetry, setMakesRetry] = useState(0)
  const [modelsRetry, setModelsRetry] = useState(0)
  const [variantsRetry, setVariantsRetry] = useState(0)
  const vinRequest = useRef<AbortController | null>(null)
  const normalizedVin = data.vin.trim().toUpperCase()
  const vinIsValid = /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizedVin)

  useEffect(() => {
    if (!data.vinUnknown) return

    const controller = new AbortController()

    void loadVehicleYears(location, controller.signal)
      .then((options) => {
        if (controller.signal.aborted) return
        setYears(options)
        setYearsStatus(options.length > 0 ? 'ready' : 'empty')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setYearsStatus(statusForLookupError(error))
        }
      })

    return () => controller.abort()
  }, [data.vinUnknown, location, yearsRetry])

  useEffect(() => {
    if (!data.vinUnknown || !data.vehicleYear) return

    const controller = new AbortController()

    void loadVehicleMakes(location, data.vehicleYear, controller.signal)
      .then((options) => {
        if (controller.signal.aborted) return
        setMakes(options)
        setMakesStatus(options.length > 0 ? 'ready' : 'empty')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setMakesStatus(statusForLookupError(error))
        }
      })

    return () => controller.abort()
  }, [data.vehicleYear, data.vinUnknown, location, makesRetry])

  useEffect(() => {
    if (!data.vinUnknown || !data.vehicleYear || !data.vehicleMakeId) return

    const controller = new AbortController()

    void loadVehicleModels(
      location,
      data.vehicleYear,
      data.vehicleMakeId,
      controller.signal,
    )
      .then((options) => {
        if (controller.signal.aborted) return
        setModels(options)
        setModelsStatus(options.length > 0 ? 'ready' : 'empty')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setModelsStatus(statusForLookupError(error))
        }
      })

    return () => controller.abort()
  }, [
    data.vehicleMakeId,
    data.vehicleYear,
    data.vinUnknown,
    location,
    modelsRetry,
  ])

  useEffect(() => {
    if (
      !data.vinUnknown ||
      !data.vehicleYear ||
      !data.vehicleMakeId ||
      !data.vehicleModelId
    ) {
      return
    }

    const controller = new AbortController()

    void loadVehicleVariants(
      location,
      {
        year: data.vehicleYear,
        makeId: data.vehicleMakeId,
        modelId: data.vehicleModelId,
        modifierId: data.vehicleModifierId,
      },
      controller.signal,
    )
      .then((options) => {
        if (controller.signal.aborted) return
        setVariants(options)
        setVariantsStatus(options.length > 0 ? 'ready' : 'empty')

        if (options.length === 1) {
          updateData({
            quoteVehicle: buildManualVehicle(
              {
                vehicleYear: data.vehicleYear,
                vehicleMakeId: data.vehicleMakeId,
                vehicleMake: data.vehicleMake,
                vehicleModelId: data.vehicleModelId,
                vehicleModel: data.vehicleModel,
                vehicleModifierId: data.vehicleModifierId,
                vehicleModifierLabel: data.vehicleModifierLabel,
              },
              options[0],
            ),
          })
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setVariantsStatus(statusForLookupError(error))
        }
      })

    return () => controller.abort()
  }, [
    data.vehicleMakeId,
    data.vehicleMake,
    data.vehicleModelId,
    data.vehicleModel,
    data.vehicleModifierId,
    data.vehicleModifierLabel,
    data.vehicleYear,
    data.vinUnknown,
    location,
    updateData,
    variantsRetry,
  ])

  useEffect(() => () => vinRequest.current?.abort(), [])

  function switchToManual() {
    vinRequest.current?.abort()
    setVinStatus('idle')
    setYearsStatus('loading')
    setMakes([])
    setModels([])
    setVariants([])
    setMakesStatus('idle')
    setModelsStatus('idle')
    setVariantsStatus('idle')
    updateData({
      ...clearManualVehicle(),
      vinUnknown: true,
      vin: '',
      quoteVehicle: null,
    })
  }

  function switchToVin() {
    updateData({
      ...clearManualVehicle(),
      vinUnknown: false,
      vin: '',
      quoteVehicle: null,
    })
  }

  function handleVinChange(value: string) {
    vinRequest.current?.abort()
    setVinStatus('idle')
    updateData({
      ...clearManualVehicle(),
      vin: value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 17),
      quoteVehicle: null,
    })
  }

  async function resolveVin() {
    if (!vinIsValid || vinStatus === 'loading') return

    vinRequest.current?.abort()
    const controller = new AbortController()
    vinRequest.current = controller
    setVinStatus('loading')
    updateData({ quoteVehicle: null })

    try {
      const result = await loadVehicleByVin(
        location,
        normalizedVin,
        controller.signal,
      )
      const vehicle = await completeVinVehicle(
        location,
        result,
        controller.signal,
      )

      if (!controller.signal.aborted) {
        updateData({
          vin: normalizedVin,
          vehicleYear: vehicle.year,
          vehicleMakeId: vehicle.makeId,
          vehicleMake: vehicle.makeLabel,
          vehicleModelId: vehicle.modelId,
          vehicleModel: vehicle.modelLabel,
          vehicleModifierId: vehicle.modifierId,
          vehicleModifierLabel: vehicle.modifierLabel,
          quoteVehicle: vehicle,
        })
        setVinStatus('ready')
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setVinStatus(statusForLookupError(error))
      }
    }
  }

  function selectYear(year: string) {
    setMakes([])
    setModels([])
    setVariants([])
    setMakesStatus(year ? 'loading' : 'idle')
    setModelsStatus('idle')
    setVariantsStatus('idle')
    updateData({
      ...clearManualVehicleAfterYear(),
      vehicleYear: year,
      quoteVehicle: null,
    })
  }

  function selectMake(makeId: string) {
    const option = makes.find((make) => make.id === makeId)
    setModels([])
    setVariants([])
    setModelsStatus(option ? 'loading' : 'idle')
    setVariantsStatus('idle')
    updateData({
      ...clearManualVehicleAfterMake(),
      vehicleMakeId: option?.id ?? '',
      vehicleMake: option?.label ?? '',
      quoteVehicle: null,
    })
  }

  function selectModel(value: string) {
    const option = models.find((model) => modelOptionValue(model) === value)
    setVariants([])
    setVariantsStatus(option ? 'loading' : 'idle')
    updateData({
      vehicleModelId: option?.id ?? '',
      vehicleModel: option?.label ?? '',
      vehicleModifierId: option?.modifierId ?? null,
      vehicleModifierLabel: option?.modifierLabel ?? null,
      quoteVehicle: null,
    })
  }

  function selectVariant(vehicleId: string) {
    const option = variants.find((variant) => variant.vehicleId === vehicleId)
    updateData({
      quoteVehicle: option ? buildManualVehicle(data, option) : null,
    })
  }

  return (
    <KioskStep title="Tell us about your vehicle">
      <QuoteForm>
        <p className="text-center text-lg font-medium text-muted-foreground">
          Use your VIN for the fastest match, or select the vehicle manually.
        </p>

        {!data.vinUnknown ? (
          <QuoteField id="vehicle-vin" label="VIN">
            <QuoteInput
              id="vehicle-vin"
              value={data.vin}
              maxLength={17}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              placeholder="17-character VIN"
              onChange={(event) => handleVinChange(event.target.value)}
            />
            {data.vin.length > 0 && !vinIsValid && (
              <p className="text-sm font-medium text-destructive">
                Enter all 17 characters. VINs cannot contain I, O, or Q.
              </p>
            )}
            <LookupFeedback
              status={vinStatus}
              loading="Matching your VIN…"
              empty="We couldn't match that VIN. Check it or use manual selection."
              error="VIN lookup is temporarily unavailable. Try again or select manually."
              onRetry={() => void resolveVin()}
            />
            <QuoteHelperButton onClick={switchToManual}>
              Select year, make, and model instead
            </QuoteHelperButton>
          </QuoteField>
        ) : (
          <div className="space-y-5 rounded-[1.4rem] border border-[#d7e1e3] bg-white p-5 shadow-sm">
            <QuoteField id="vehicle-year" label="Vehicle year">
              <QuoteSelect
                id="vehicle-year"
                value={data.vehicleYear}
                disabled={yearsStatus === 'loading'}
                onChange={(event) => selectYear(event.target.value)}
              >
                <option value="">
                  {yearsStatus === 'loading' ? 'Loading years…' : 'Select year'}
                </option>
                {years.map((option) => (
                  <option key={option.year} value={option.year}>
                    {option.year}
                  </option>
                ))}
              </QuoteSelect>
              <LookupFeedback
                status={yearsStatus}
                empty="No vehicle years are currently available."
                error="We couldn't load vehicle years."
                onRetry={() => {
                  setYearsStatus('loading')
                  setYearsRetry((value) => value + 1)
                }}
              />
            </QuoteField>

            <QuoteField id="vehicle-make" label="Vehicle make">
              <QuoteSelect
                id="vehicle-make"
                value={data.vehicleMakeId}
                disabled={!data.vehicleYear || makesStatus === 'loading'}
                onChange={(event) => selectMake(event.target.value)}
              >
                <option value="">
                  {makesStatus === 'loading' ? 'Loading makes…' : 'Select make'}
                </option>
                {makes.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </QuoteSelect>
              <LookupFeedback
                status={makesStatus}
                empty="No makes were found for that year."
                error="We couldn't load vehicle makes."
                onRetry={() => {
                  setMakesStatus('loading')
                  setMakesRetry((value) => value + 1)
                }}
              />
            </QuoteField>

            <QuoteField id="vehicle-model" label="Vehicle model">
              <QuoteSelect
                id="vehicle-model"
                value={
                  data.vehicleModelId
                    ? `${data.vehicleModelId}:${data.vehicleModifierId ?? ''}`
                    : ''
                }
                disabled={!data.vehicleMakeId || modelsStatus === 'loading'}
                onChange={(event) => selectModel(event.target.value)}
              >
                <option value="">
                  {modelsStatus === 'loading'
                    ? 'Loading models…'
                    : 'Select model'}
                </option>
                {models.map((option) => (
                  <option
                    key={modelOptionValue(option)}
                    value={modelOptionValue(option)}
                  >
                    {modelOptionLabel(option)}
                  </option>
                ))}
              </QuoteSelect>
              <LookupFeedback
                status={modelsStatus}
                empty="No models were found for that make."
                error="We couldn't load vehicle models."
                onRetry={() => {
                  setModelsStatus('loading')
                  setModelsRetry((value) => value + 1)
                }}
              />
            </QuoteField>

            {variants.length > 1 && (
              <QuoteField id="vehicle-variant" label="Body style or trim">
                <QuoteSelect
                  id="vehicle-variant"
                  value={data.quoteVehicle?.vehicleId ?? ''}
                  onChange={(event) => selectVariant(event.target.value)}
                >
                  <option value="">Select body style or trim</option>
                  {variants.map((option) => (
                    <option key={option.vehicleId} value={option.vehicleId}>
                      {option.label}
                    </option>
                  ))}
                </QuoteSelect>
              </QuoteField>
            )}

            <LookupFeedback
              status={variantsStatus}
              loading="Loading body styles and trims…"
              empty="No matching body styles or trims were found."
              error="We couldn't load body styles and trims."
              onRetry={() => {
                setVariantsStatus('loading')
                setVariantsRetry((value) => value + 1)
              }}
            />

            <QuoteHelperButton onClick={switchToVin}>
              Use my VIN instead
            </QuoteHelperButton>
          </div>
        )}

        {data.quoteVehicle && (
          <VehicleConfirmation vehicle={data.quoteVehicle} />
        )}

        <QuoteContinueButton
          disabled={
            data.vinUnknown
              ? !data.quoteVehicle
              : vinStatus === 'loading' || (!data.quoteVehicle && !vinIsValid)
          }
          onClick={() => {
            if (data.quoteVehicle) goTo('windshieldGlass')
            else void resolveVin()
          }}
        >
          {!data.vinUnknown && !data.quoteVehicle
            ? vinStatus === 'loading'
              ? 'Matching vehicle…'
              : 'Look up VIN'
            : 'Continue'}
        </QuoteContinueButton>
      </QuoteForm>
    </KioskStep>
  )
}

type LookupStatus = 'idle' | 'loading' | 'ready' | 'empty' | 'error'

function LookupFeedback({
  status,
  loading,
  empty,
  error,
  onRetry,
}: {
  status: LookupStatus
  loading?: string
  empty: string
  error: string
  onRetry: () => void
}) {
  if (status === 'loading' && loading) {
    return (
      <p className="text-sm font-medium text-muted-foreground">{loading}</p>
    )
  }

  if (status !== 'empty' && status !== 'error') return null

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-accent-tint p-3">
      <p className="text-sm font-medium text-[#40525a]">
        {status === 'empty' ? empty : error}
      </p>
      <button
        type="button"
        className="shrink-0 text-sm font-bold text-accent underline decoration-2 underline-offset-4"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  )
}

function VehicleConfirmation({ vehicle }: { vehicle: QuoteVehicle }) {
  return (
    <div
      className="rounded-xl border border-accent/30 bg-accent-tint p-4"
      aria-live="polite"
    >
      <p className="text-sm font-bold uppercase tracking-wide text-accent">
        Vehicle matched
      </p>
      <p className="mt-1 text-lg font-bold text-[#16262f]">
        {[
          vehicle.year,
          vehicle.makeLabel,
          vehicle.modelLabel,
          vehicle.modifierLabel,
        ]
          .filter(Boolean)
          .join(' ')}
      </p>
      {vehicle.variantLabel && (
        <p className="mt-1 font-medium text-[#40525a]">
          {vehicle.variantLabel}
        </p>
      )}
    </div>
  )
}

function buildManualVehicle(
  data: Pick<
    KioskData,
    | 'vehicleYear'
    | 'vehicleMakeId'
    | 'vehicleMake'
    | 'vehicleModelId'
    | 'vehicleModel'
    | 'vehicleModifierId'
    | 'vehicleModifierLabel'
  >,
  variant: VehicleVariantOption,
): QuoteVehicle {
  return {
    year: data.vehicleYear,
    makeId: data.vehicleMakeId,
    makeLabel: data.vehicleMake,
    modelId: data.vehicleModelId,
    modelLabel: data.vehicleModel,
    modifierId: data.vehicleModifierId,
    modifierLabel: data.vehicleModifierLabel,
    vehicleId: variant.vehicleId,
    variantLabel: variant.label,
    vin: null,
  }
}

async function completeVinVehicle(
  location: string,
  result: VinVehicleResult,
  signal: AbortSignal,
): Promise<QuoteVehicle> {
  if (!result.year) throw new Error('VIN response is missing a year')

  let makeId = result.makeId
  let makeLabel = result.makeLabel

  if (!makeId || !makeLabel) {
    const makes = await loadVehicleMakes(location, result.year, signal)
    const matches = makes.filter((option) =>
      makeId
        ? option.id === makeId
        : normalizeLabel(option.label) === normalizeLabel(makeLabel),
    )
    const uniqueIds = new Set(matches.map((option) => option.id))

    if (matches.length === 0 || uniqueIds.size !== 1) {
      throw new Error('VIN make could not be normalized')
    }

    makeId = matches[0].id
    makeLabel = matches[0].label
  }

  let modelId = result.modelId
  let modelLabel = result.modelLabel
  let modifierId = result.modifierId
  let modifierLabel = result.modifierLabel

  if (!modelId || !modelLabel) {
    const models = await loadVehicleModels(
      location,
      result.year,
      makeId,
      signal,
    )
    let matches = models.filter((option) =>
      modelId
        ? option.id === modelId
        : normalizeLabel(option.label) === normalizeLabel(modelLabel),
    )

    if (modifierId) {
      matches = matches.filter((option) => option.modifierId === modifierId)
    } else if (modifierLabel) {
      matches = matches.filter(
        (option) =>
          normalizeLabel(option.modifierLabel) ===
          normalizeLabel(modifierLabel),
      )
    }

    const uniqueIds = new Set(matches.map((option) => option.id))
    if (matches.length === 0 || uniqueIds.size !== 1) {
      throw new Error('VIN model could not be normalized')
    }

    modelId = matches[0].id
    modelLabel = matches[0].label
    modifierId = matches[0].modifierId
    modifierLabel = matches[0].modifierLabel
  }

  return {
    year: result.year,
    makeId,
    makeLabel,
    modelId,
    modelLabel,
    modifierId,
    modifierLabel,
    vehicleId: result.vehicleId,
    variantLabel: result.variantLabel,
    vin: result.vin,
  }
}

function normalizeLabel(value: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function modelOptionValue(option: VehicleModelOption) {
  return `${option.id}:${option.modifierId ?? ''}`
}

function modelOptionLabel(option: VehicleModelOption) {
  return option.modifierLabel
    ? `${option.label} — ${option.modifierLabel}`
    : option.label
}

function statusForLookupError(error: unknown): LookupStatus {
  return error instanceof KioskOmegaLookupError && error.code === 'no_results'
    ? 'empty'
    : 'error'
}

function clearManualVehicle(): Partial<KioskData> {
  return {
    vehicleYear: '',
    ...clearManualVehicleAfterYear(),
  }
}

function clearManualVehicleAfterYear(): Partial<KioskData> {
  return {
    vehicleMakeId: '',
    vehicleMake: '',
    ...clearManualVehicleAfterMake(),
  }
}

function clearManualVehicleAfterMake(): Partial<KioskData> {
  return {
    vehicleModelId: '',
    vehicleModel: '',
    vehicleModifierId: null,
    vehicleModifierLabel: null,
  }
}
