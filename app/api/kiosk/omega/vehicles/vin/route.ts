import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteVehicleByVin } from '@/lib/omega/quote-lookups'
import {
  executeQuoteLookup,
  invalidQuoteRequestResponse,
  locationSlugSchema,
  readQuoteQuery,
  vinQuerySchema,
} from '@/lib/omega/quote-route'

const querySchema = z
  .object({
    location: locationSlugSchema,
    vin: vinQuerySchema,
  })
  .strict()

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(readQuoteQuery(request))

  if (!query.success) return invalidQuoteRequestResponse()

  return executeQuoteLookup('vehicle_vin', query.data.location, () =>
    getQuoteVehicleByVin(query.data.vin),
  )
}
