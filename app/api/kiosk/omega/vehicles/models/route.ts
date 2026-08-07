import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteVehicleModels } from '@/lib/omega/quote-lookups'
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
  })
  .strict()

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(readQuoteQuery(request))

  if (!query.success) return invalidQuoteRequestResponse()

  return executeQuoteLookup('vehicle_models', query.data.location, () =>
    getQuoteVehicleModels(query.data.year, query.data.makeId),
  )
}
