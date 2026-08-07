import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteInsuranceCompanies } from '@/lib/omega/quote-lookups'
import {
  executeQuoteLookup,
  invalidQuoteRequestResponse,
  locationSlugSchema,
  readQuoteQuery,
} from '@/lib/omega/quote-route'

const querySchema = z.object({ location: locationSlugSchema }).strict()

export async function GET(request: NextRequest) {
  const query = querySchema.safeParse(readQuoteQuery(request))

  if (!query.success) return invalidQuoteRequestResponse()

  return executeQuoteLookup('insurance_companies', query.data.location, () =>
    getQuoteInsuranceCompanies(),
  )
}
