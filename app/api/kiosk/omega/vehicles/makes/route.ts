import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteVehicleMakes } from '@/lib/omega/quote-lookups'
import {
  executeQuoteLookup,
  invalidQuoteRequestResponse,
  locationSlugSchema,
  readQuoteQuery,
  vehicleYearQuerySchema,
} from '@/lib/omega/quote-route'

const querySchema = z
  .object({
    location: locationSlugSchema,
    year: vehicleYearQuerySchema,
  })
  .strict()

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(readQuoteQuery(request))

  if (!query.success) return invalidQuoteRequestResponse()

  return executeQuoteLookup('vehicle_makes', query.data.location, () =>
    getQuoteVehicleMakes(query.data.year),
  )
}
