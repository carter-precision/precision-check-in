import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteVehicleVariants } from '@/lib/omega/quote-lookups'
import {
  executeQuoteLookup,
  invalidQuoteRequestResponse,
  locationSlugSchema,
  omegaEntityIdQuerySchema,
  readQuoteQuery,
  vehicleYearQuerySchema,
} from '@/lib/omega/quote-route'

const querySchema = z
  .object({
    location: locationSlugSchema,
    year: vehicleYearQuerySchema,
    makeId: omegaEntityIdQuerySchema,
    modelId: omegaEntityIdQuerySchema,
    modifierId: omegaEntityIdQuerySchema.optional(),
  })
  .strict()

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(readQuoteQuery(request))

  if (!query.success) return invalidQuoteRequestResponse()

  return executeQuoteLookup('vehicle_variants', query.data.location, () =>
    getQuoteVehicleVariants(
      query.data.year,
      query.data.makeId,
      query.data.modelId,
      query.data.modifierId ?? null,
    ),
  )
}
