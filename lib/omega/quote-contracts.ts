import { z } from 'zod'

import type {
  InsuranceCompanyOption,
  VehicleMakeOption,
  VehicleModelOption,
  VehicleVariantOption,
  VehicleYearOption,
  VinVehicleResult,
} from './quote-types'

const rawScalarSchema = z.union([z.string(), z.number(), z.null()])
const optionalRawScalarSchema = rawScalarSchema.optional()
const numericIdSchema = z
  .union([z.string(), z.number().int().nonnegative()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d+$/))
const yearSchema = z
  .union([z.string(), z.number().int()])
  .transform((value) => String(value).trim())
  .pipe(z.string().regex(/^\d{4}$/))
const labelSchema = z.string().trim().min(1)

const rawYearSchema = z
  .union([
    yearSchema,
    z.object({ year: yearSchema }),
    z.object({ vehicle_year: yearSchema }),
  ])
  .transform((value) =>
    typeof value === 'string'
      ? { year: value }
      : 'year' in value
        ? { year: value.year }
        : { year: value.vehicle_year },
  )

const rawMakeSchema = z
  .object({
    make_id: numericIdSchema,
    make_name: labelSchema,
  })
  .transform((value): VehicleMakeOption => ({
    id: value.make_id,
    label: value.make_name,
  }))

const rawModelSchema = z
  .object({
    model_id: numericIdSchema,
    model_name: labelSchema,
    modifier_id: optionalRawScalarSchema,
    modifier_dsc: optionalRawScalarSchema,
  })
  .transform((value): VehicleModelOption => ({
    id: value.model_id,
    label: value.model_name,
    modifierId: normalizeOptionalId(value.modifier_id),
    modifierLabel: normalizeOptionalLabel(value.modifier_dsc),
  }))

const rawVariantSchema = z
  .object({
    vehicle_id: numericIdSchema,
    body_style_id: optionalRawScalarSchema,
    body_style_dsc: labelSchema,
  })
  .transform((value): VehicleVariantOption => ({
    vehicleId: value.vehicle_id,
    bodyStyleId: normalizeOptionalId(value.body_style_id),
    label: value.body_style_dsc,
  }))

const rawCompanySchema = z
  .object({
    id: numericIdSchema,
    company: labelSchema,
  })
  .transform((value): InsuranceCompanyOption => ({
    id: value.id,
    label: value.company,
  }))

const rawVinVehicleSchema = z.object({
  vehicle_id: numericIdSchema,
  year: optionalRawScalarSchema,
  vehicle_year: optionalRawScalarSchema,
  make_id: optionalRawScalarSchema,
  make_name: optionalRawScalarSchema,
  model_id: optionalRawScalarSchema,
  model_name: optionalRawScalarSchema,
  modifier_id: optionalRawScalarSchema,
  modifier_dsc: optionalRawScalarSchema,
  body_style_id: optionalRawScalarSchema,
  body_style_dsc: optionalRawScalarSchema,
  vehicle_description: optionalRawScalarSchema,
})

export class OmegaQuoteContractError extends Error {
  constructor(contract: string) {
    super(`Omega returned a malformed ${contract} response`)
    this.name = 'OmegaQuoteContractError'
  }
}

export function normalizeVehicleYears(payload: unknown): VehicleYearOption[] {
  return uniqueBy(
    parseCollection(payload, rawYearSchema, 'vehicle years'),
    (option) => option.year,
  )
}

export function normalizeVehicleMakes(payload: unknown): VehicleMakeOption[] {
  return uniqueBy(
    parseCollection(payload, rawMakeSchema, 'vehicle makes'),
    (option) => option.id,
  )
}

export function normalizeVehicleModels(payload: unknown): VehicleModelOption[] {
  return uniqueBy(
    parseCollection(payload, rawModelSchema, 'vehicle models'),
    (option) => `${option.id}:${option.modifierId ?? ''}`,
  )
}

export function normalizeVehicleVariants(
  payload: unknown,
): VehicleVariantOption[] {
  return uniqueBy(
    parseCollection(payload, rawVariantSchema, 'vehicle variants'),
    (option) => option.vehicleId,
  )
}

export function normalizeInsuranceCompanies(
  payload: unknown,
): InsuranceCompanyOption[] {
  return uniqueBy(
    parseCollection(payload, rawCompanySchema, 'insurance companies'),
    (option) => option.id,
  )
}

export function normalizeVinVehicle(
  payload: unknown,
  vin: string,
): VinVehicleResult | null {
  const parsed = z
    .union([
      rawVinVehicleSchema,
      z.array(rawVinVehicleSchema),
      z.object({
        data: z.union([rawVinVehicleSchema, z.array(rawVinVehicleSchema)]),
      }),
      z.object({
        results: z.union([rawVinVehicleSchema, z.array(rawVinVehicleSchema)]),
      }),
    ])
    .safeParse(payload)

  if (!parsed.success) {
    throw new OmegaQuoteContractError('VIN vehicle')
  }

  const value = unwrapSingleRecord(parsed.data)

  if (!value) return null

  return {
    vin,
    vehicleId: value.vehicle_id,
    year: normalizeOptionalYear(value.year ?? value.vehicle_year),
    makeId: normalizeOptionalId(value.make_id),
    makeLabel: normalizeOptionalLabel(value.make_name),
    modelId: normalizeOptionalId(value.model_id),
    modelLabel: normalizeOptionalLabel(value.model_name),
    modifierId: normalizeOptionalId(value.modifier_id),
    modifierLabel: normalizeOptionalLabel(value.modifier_dsc),
    bodyStyleId: normalizeOptionalId(value.body_style_id),
    variantLabel:
      normalizeOptionalLabel(value.body_style_dsc) ??
      normalizeOptionalLabel(value.vehicle_description),
  }
}

function parseCollection<TSchema extends z.ZodType>(
  payload: unknown,
  itemSchema: TSchema,
  contract: string,
): Array<z.output<TSchema>> {
  const parsed = z
    .union([
      z.array(itemSchema),
      z.object({ data: z.array(itemSchema) }),
      z.object({ results: z.array(itemSchema) }),
    ])
    .safeParse(payload)

  if (!parsed.success) {
    throw new OmegaQuoteContractError(contract)
  }

  return Array.isArray(parsed.data)
    ? parsed.data
    : 'data' in parsed.data
      ? parsed.data.data
      : parsed.data.results
}

function unwrapSingleRecord(
  payload:
    | z.infer<typeof rawVinVehicleSchema>
    | Array<z.infer<typeof rawVinVehicleSchema>>
    | {
        data:
          | z.infer<typeof rawVinVehicleSchema>
          | Array<z.infer<typeof rawVinVehicleSchema>>
      }
    | {
        results:
          | z.infer<typeof rawVinVehicleSchema>
          | Array<z.infer<typeof rawVinVehicleSchema>>
      },
) {
  if (Array.isArray(payload)) return payload[0] ?? null
  if ('data' in payload) {
    return Array.isArray(payload.data)
      ? (payload.data[0] ?? null)
      : payload.data
  }
  if ('results' in payload) {
    return Array.isArray(payload.results)
      ? (payload.results[0] ?? null)
      : payload.results
  }
  return payload
}

function normalizeOptionalId(value: string | number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const parsed = numericIdSchema.safeParse(value)
  if (!parsed.success) throw new OmegaQuoteContractError('numeric identifier')
  return parsed.data
}

function normalizeOptionalYear(value: string | number | null | undefined) {
  if (value === null || value === undefined || String(value).trim() === '') {
    return null
  }

  const parsed = yearSchema.safeParse(value)
  if (!parsed.success) throw new OmegaQuoteContractError('vehicle year')
  return parsed.data
}

function normalizeOptionalLabel(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null
  const normalized = String(value).trim()
  return normalized || null
}

function uniqueBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = keyFor(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
