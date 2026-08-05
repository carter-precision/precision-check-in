'use server'

import { z } from 'zod'

import { readCustomerCheckInProof } from '@/lib/auth/customer-check-in-proof'
import { isDevAuthBypassEnabled } from '@/lib/auth/dev-auth'
import { getDeviceCookie } from '@/lib/auth/device-session'
import {
  closeCheckIn,
  createCheckIn,
  createVerifiedCustomerCheckIn,
  type CreateCheckInInput,
} from '@/lib/data/check-ins'
import { getDeviceByToken } from '@/lib/data/devices'
import { getLocationBySlug } from '@/lib/data/locations'

const locationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9-]+$/)

const kioskCheckInSchema = z
  .object({
    locationSlug: locationSlugSchema,
    customerName: z.string().trim().min(1).max(200),
    phone: z.string().trim().max(50).optional(),
    visitType: z.enum(['appointment', 'vehicle_pickup', 'walk_in']),
    serviceType: z
      .enum(['windshield', 'rock_chip', 'other', 'bell'])
      .nullable()
      .optional(),
    paymentType: z.enum(['cash', 'insurance']).nullable().optional(),
    source: z.literal('kiosk'),
    windshieldIntent: z.enum(['quote', 'inspection']).nullable().optional(),
    repairAuthorized: z.boolean().optional(),
  })
  .strict()

const closeCheckInSchema = z.object({
  id: z.uuid(),
  locationSlug: locationSlugSchema,
})

const customerCheckInFormSchema = z.object({
  proof: z.string().min(1).max(4_000),
  arrivalMode: z.enum(['lobby', 'vehicle']),
})

const manualVehicleInfoSchema = z
  .string()
  .max(28)
  .transform(sanitizeVehicleInfo)
  .pipe(z.string().min(1).max(28))

export type CustomerCheckInActionState =
  | { status: 'idle' }
  | {
      status: 'success'
      message: string
      arrivalMode: 'lobby' | 'vehicle'
    }
  | { status: 'error'; message: string }

export async function createCheckInAction(input: CreateCheckInInput) {
  const parsed = kioskCheckInSchema.parse(input)

  await requireDeviceForLocation('kiosk', parsed.locationSlug)

  return createCheckIn(parsed)
}

export async function closeCheckInAction(id: string, locationSlug: string) {
  const parsed = closeCheckInSchema.parse({ id, locationSlug })
  const locationId = await requireDeviceForLocation(
    'dashboard',
    parsed.locationSlug,
  )

  return closeCheckIn(parsed.id, locationId)
}

export async function createCustomerCheckInAction(
  _previousState: CustomerCheckInActionState,
  formData: FormData,
): Promise<CustomerCheckInActionState> {
  const parsed = customerCheckInFormSchema.safeParse({
    proof: formData.get('proof'),
    arrivalMode: formData.get('arrivalMode'),
  })

  if (!parsed.success) {
    return {
      status: 'error',
      message:
        'This check-in link is no longer valid. Please open the link from your reminder again.',
    }
  }

  const appointment = readCustomerCheckInProof(parsed.data.proof)

  if (!appointment) {
    return {
      status: 'error',
      message:
        'This check-in link has expired. Please open the link from your reminder again.',
    }
  }

  if (Date.now() > appointment.appointmentEnd) {
    return {
      status: 'error',
      message:
        'This check-in link has expired. Please open the link from your reminder again.',
    }
  }

  let vehicleDescription = appointment.vehicleDescription

  if (parsed.data.arrivalMode === 'vehicle' && !vehicleDescription) {
    const parsedVehicleInfo = manualVehicleInfoSchema.safeParse(
      formData.get('vehicleInfo'),
    )

    if (!parsedVehicleInfo.success) {
      return {
        status: 'error',
        message: 'Enter your vehicle information using 28 characters or fewer.',
      }
    }

    vehicleDescription = parsedVehicleInfo.data
  }

  try {
    const result = await createVerifiedCustomerCheckIn({
      locationSlug: appointment.locationSlug,
      customerName: appointment.customerName,
      phone: appointment.phone,
      arrivalMode: parsed.data.arrivalMode,
      vehicleDescription:
        parsed.data.arrivalMode === 'vehicle' ? vehicleDescription : null,
      omegaAppointmentId: appointment.omegaAppointmentId,
      omegaInvoiceId: appointment.omegaInvoiceId,
      omegaAppointmentGuidHash: appointment.appointmentGuidHash,
    })

    return {
      status: 'success',
      arrivalMode: parsed.data.arrivalMode,
      message:
        result.status === 'already_checked_in'
          ? "You're already checked in. We'll be with you soon."
          : "You're checked in. We'll be with you soon.",
    }
  } catch (error) {
    console.error('Customer check-in submission failed', error)
    return {
      status: 'error',
      message:
        "We couldn't complete your check-in. Please check in inside and our team will help you.",
    }
  }
}

function sanitizeVehicleInfo(value: string) {
  return value
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s.,/&'()#-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function requireDeviceForLocation(
  type: 'kiosk' | 'dashboard',
  locationSlug: string,
) {
  if (isDevAuthBypassEnabled()) {
    const location = await getLocationBySlug(locationSlug)
    return location.id
  }

  const token = await getDeviceCookie()

  if (!token) {
    throw new Error('Unauthorized')
  }

  try {
    const device = await getDeviceByToken(token, type)
    const deviceLocationSlug = Array.isArray(device.locations)
      ? device.locations[0]?.slug
      : device.locations?.slug

    if (deviceLocationSlug !== locationSlug) {
      throw new Error('Unauthorized')
    }

    return device.location_id
  } catch {
    throw new Error('Unauthorized')
  }
}
