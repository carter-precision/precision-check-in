import 'server-only'

import {
  normalizeInsuranceCompanies,
  normalizeVehicleMakes,
  normalizeVehicleModels,
  normalizeVehicleVariants,
  normalizeVehicleYears,
  normalizeVinVehicle,
} from './quote-contracts'
import { quoteOmegaJsonRequest } from './quote-client'

export async function getQuoteVehicleYears() {
  const payload = await quoteOmegaJsonRequest('/NagsVehicles/search')
  return normalizeVehicleYears(payload)
}

export async function getQuoteVehicleMakes(year: string) {
  const payload = await quoteOmegaJsonRequest(
    `/NagsVehicles/search/${encodeURIComponent(year)}`,
  )
  return normalizeVehicleMakes(payload)
}

export async function getQuoteVehicleModels(year: string, makeId: string) {
  const payload = await quoteOmegaJsonRequest(
    `/NagsVehicles/search/${encodeURIComponent(year)}/${encodeURIComponent(makeId)}`,
  )
  return normalizeVehicleModels(payload)
}

export async function getQuoteVehicleVariants(
  year: string,
  makeId: string,
  modelId: string,
  modifierId: string | null,
) {
  const query = new URLSearchParams()

  if (modifierId) {
    query.set('modifier_id', modifierId)
  }

  const payload = await quoteOmegaJsonRequest(
    `/NagsVehicles/search/${encodeURIComponent(year)}/${encodeURIComponent(makeId)}/${encodeURIComponent(modelId)}`,
    query,
  )
  return normalizeVehicleVariants(payload)
}

export async function getQuoteVehicleByVin(vin: string) {
  const payload = await quoteOmegaJsonRequest(
    `/NagsVehicles/${encodeURIComponent(vin)}`,
  )
  return normalizeVinVehicle(payload, vin)
}

export async function getQuoteInsuranceCompanies() {
  const query = new URLSearchParams({
    type: 'insurance',
    active_only: 'true',
    publicly_visible: '1',
    folder: 'pag',
  })
  const payload = await quoteOmegaJsonRequest('/Companies', query)
  return normalizeInsuranceCompanies(payload)
}
