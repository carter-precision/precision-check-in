import type { NextRequest } from 'next/server'
import { z } from 'zod'

import { getQuoteInsuranceCompany } from '@/lib/omega/quote-lookups'
import {
  executeQuoteLookup,
  invalidQuoteRequestResponse,
  locationSlugSchema,
  omegaEntityIdQuerySchema,
  readQuoteQuery,
} from '@/lib/omega/quote-route'

const querySchema = z.object({ location: locationSlugSchema }).strict()
const paramsSchema = z.object({ companyId: omegaEntityIdQuerySchema }).strict()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> },
) {
  const query = querySchema.safeParse(readQuoteQuery(request))
  const params = paramsSchema.safeParse(await context.params)

  if (!query.success || !params.success) {
    return invalidQuoteRequestResponse()
  }

  return executeQuoteLookup('insurance_company', query.data.location, () =>
    getQuoteInsuranceCompany(params.data.companyId),
  )
}
