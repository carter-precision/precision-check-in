import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeInsuranceCompanies,
  normalizeVehicleMakes,
  normalizeVehicleModels,
  normalizeVehicleVariants,
  normalizeVehicleYears,
  normalizeVinVehicle,
} from '../lib/omega/quote-contracts.ts'
import {
  extractQuoteInvoiceId,
  normalizeQuoteInvoice,
  OmegaQuoteInvoiceContractError,
} from '../lib/omega/quote-invoice.ts'
import { retryQuoteInvoiceGet } from '../lib/omega/quote-invoice-retry.ts'
import {
  buildOmegaQuoteRequest,
  getServerGlassPosition,
  quoteRecoveryRequestSchema,
  quoteSubmissionSchema,
  requiresInvoiceQuoteResult,
} from '../lib/omega/quote-request.ts'
import {
  insuranceQuoteAcknowledgementSchema,
  quoteResultSchema,
} from '../lib/omega/quote-result.ts'
import {
  getGlassPosition,
  isGlassQuoteSupported,
} from '../components/kiosk/quote-options.ts'
import { buildQuoteSubmission } from '../components/kiosk/quote-submission.ts'
import { initialKioskData } from '../components/kiosk/types.ts'

const validVin = '1HGCM82633A004352'

const quoteVehicle = {
  year: '2017',
  makeId: '138',
  makeLabel: 'Ford',
  modelId: '4543',
  modelLabel: 'Fusion',
  modifierId: null,
  modifierLabel: null,
  vehicleId: '66687',
  variantLabel: '4 Door Sedan',
  vin: validVin,
}

const cashSubmission = {
  locationSlug: 'layton',
  customer: {
    firstName: 'Validation',
    phone: '8015550100',
    email: 'validation@example.com',
    zip: '84041',
    smsConsent: false,
  },
  vehicle: quoteVehicle,
  glass: { type: 'windshield', position: 'W' },
  service: {
    mode: 'shop',
    address: null,
    shopLocation: 'layton',
    preferredDate: null,
  },
  payment: { mode: 'cash' },
}

test('normalizes the documented 2017 Ford Fusion lookup chain', () => {
  assert.deepEqual(normalizeVehicleYears([{ year: 2017 }]), [{ year: '2017' }])
  assert.deepEqual(
    normalizeVehicleMakes([{ make_id: 138, make_name: 'Ford' }]),
    [{ id: '138', label: 'Ford' }],
  )
  assert.deepEqual(
    normalizeVehicleModels([
      {
        model_id: 4543,
        model_name: 'Fusion',
        modifier_id: null,
        modifier_dsc: null,
      },
      {
        model_id: 4543,
        model_name: 'Fusion',
        modifier_id: 12,
        modifier_dsc: 'Hybrid',
      },
    ]),
    [
      {
        id: '4543',
        label: 'Fusion',
        modifierId: null,
        modifierLabel: null,
      },
      {
        id: '4543',
        label: 'Fusion',
        modifierId: '12',
        modifierLabel: 'Hybrid',
      },
    ],
  )
  assert.deepEqual(
    normalizeVehicleVariants([
      {
        body_style_id: 190,
        body_style_dsc: '4 Door Sedan',
        vehicle_id: 66687,
      },
    ]),
    [{ vehicleId: '66687', bodyStyleId: '190', label: '4 Door Sedan' }],
  )
})

test('normalizes VIN and insurance lookup responses into minimal DTOs', () => {
  assert.deepEqual(
    normalizeVinVehicle(
      {
        data: {
          vehicle_id: 66687,
          year: 2017,
          make_id: 138,
          make_name: 'Ford',
          model_id: 4543,
          model_name: 'Fusion',
          body_style_id: 190,
          body_style_dsc: '4 Door Sedan',
        },
      },
      validVin,
    ),
    {
      vin: validVin,
      vehicleId: '66687',
      year: '2017',
      makeId: '138',
      makeLabel: 'Ford',
      modelId: '4543',
      modelLabel: 'Fusion',
      modifierId: null,
      modifierLabel: null,
      bodyStyleId: '190',
      variantLabel: '4 Door Sedan',
    },
  )
  assert.deepEqual(
    normalizeInsuranceCompanies([{ id: 42, company: 'Allstate' }]),
    [{ id: '42', label: 'Allstate' }],
  )
})

test('accepts valid VINs and rejects VINs containing I, O, or Q', () => {
  assert.equal(quoteSubmissionSchema.safeParse(cashSubmission).success, true)

  for (const vin of [
    '1IGCM82633A004352',
    '1OGCM82633A004352',
    '1QGCM82633A004352',
    'SHORT',
  ]) {
    assert.equal(
      quoteSubmissionSchema.safeParse({
        ...cashSubmission,
        vehicle: { ...quoteVehicle, vin },
      }).success,
      false,
    )
  }
})

test('maps every supported glass selection and blocks unsupported choices', () => {
  const expected = {
    windshield: 'W',
    driver_front: 'D_FRONT_LEFT',
    passenger_front: 'D_FRONT_RIGHT',
    driver_rear: 'D_REAR_LEFT',
    passenger_rear: 'D_REAR_RIGHT',
    driver_quarter: 'Q',
    passenger_quarter: 'Q',
    quarter: 'Q',
    vent: 'V',
    back: 'B',
  }

  for (const [glassType, position] of Object.entries(expected)) {
    assert.equal(getGlassPosition(glassType), position)
    assert.equal(getServerGlassPosition(glassType), position)
    assert.equal(isGlassQuoteSupported(glassType), true)
  }

  assert.equal(getGlassPosition('sunroof'), null)
  assert.equal(getGlassPosition('other'), null)
  assert.equal(isGlassQuoteSupported('sunroof'), false)
  assert.equal(isGlassQuoteSupported('other'), false)
})

test('builds the exact approved cash request without legacy fields', () => {
  const request = buildOmegaQuoteRequest(cashSubmission)

  assert.equal(request.path, '/Quotes/66687/W')
  assert.equal(request.position, 'W')
  assert.deepEqual(Object.fromEntries(request.query), {
    year: '2017',
    make: '138',
    model: '4543',
    vehicle_id: '66687',
    position: 'W',
    customer_zip: '84041',
    customer_fname: 'Validation',
    customer_phone: '8015550100',
    customer_sms: '0',
    folder: 'pag',
    smart: 'true',
    customer_email: 'validation@example.com',
    vehicle_vin: validVin,
    opening: 'W',
    medium: 'web_quote',
    campaign: 'WEB QUOTE',
  })

  for (const forbidden of [
    'customer_surname',
    'include_recal',
    'template_id',
    'vehicle_plate_no',
    'vehicle_plate_state',
    'lead_type',
  ]) {
    assert.equal(request.query.has(forbidden), false)
  }
})

test('builds the exact approved insurance request from an Omega company ID', () => {
  const request = buildOmegaQuoteRequest({
    ...cashSubmission,
    payment: {
      mode: 'insurance',
      companyId: '42',
      companyLabel: 'Allstate',
      policyNumber: 'POLICY-123',
      deductible: 250,
    },
  })

  assert.equal(request.query.get('campaign'), 'Ins Web Quote')
  assert.equal(request.query.get('account_company_id'), '42')
  assert.equal(request.query.get('account_policy_no'), 'POLICY-123')
  assert.equal(request.query.get('account_deductible'), '250')
  assert.equal(request.query.has('opening'), false)
  assert.equal(request.query.has('medium'), false)
})

test('requires an insurance policy number and permits an omitted deductible', () => {
  const withoutDeductible = {
    ...cashSubmission,
    payment: {
      mode: 'insurance',
      companyId: '42',
      companyLabel: 'Allstate',
      policyNumber: 'POLICY-123',
      deductible: null,
    },
  }
  const parsed = quoteSubmissionSchema.safeParse(withoutDeductible)

  assert.equal(parsed.success, true)
  assert.equal(
    buildOmegaQuoteRequest(parsed.data).query.has('account_deductible'),
    false,
  )
  assert.equal(
    buildOmegaQuoteRequest(parsed.data).query.get('account_policy_no'),
    'POLICY-123',
  )
  assert.equal(
    quoteSubmissionSchema.safeParse({
      ...withoutDeductible,
      payment: { ...withoutDeductible.payment, policyNumber: ' ' },
    }).success,
    false,
  )
  assert.equal(requiresInvoiceQuoteResult('insurance'), false)
  assert.equal(requiresInvoiceQuoteResult('cash'), true)
})

test('rejects client glass-position tampering and unsupported glass types', () => {
  assert.equal(
    quoteSubmissionSchema.safeParse({
      ...cashSubmission,
      glass: { type: 'windshield', position: 'B' },
    }).success,
    false,
  )
  assert.equal(
    quoteSubmissionSchema.safeParse({
      ...cashSubmission,
      glass: { type: 'sunroof', position: 'W' },
    }).success,
    false,
  )
})

test('extracts stable and fallback invoice IDs without exposing HTML', () => {
  assert.equal(
    extractQuoteInvoiceId('<section data-invoice-id="120241"></section>'),
    '120241',
  )
  assert.equal(
    extractQuoteInvoiceId('<p>Precision Auto Glass Quote #120242</p>'),
    '120242',
  )
  assert.equal(extractQuoteInvoiceId('<h1>Quote #: 120243</h1>'), '120243')
  assert.equal(extractQuoteInvoiceId('<p>Quote Number: 120244</p>'), '120244')
  assert.equal(extractQuoteInvoiceId('<p>Invoice &#x23;120245</p>'), '120245')
  assert.equal(
    extractQuoteInvoiceId('<a href="/Invoice/120246">View</a>'),
    '120246',
  )
  assert.equal(
    extractQuoteInvoiceId('<a href="/Quotes/66687/W">Start quote</a>'),
    null,
  )
  assert.equal(
    extractQuoteInvoiceId(
      '<script>Precision Auto Glass Quote #999999</script><p>Unavailable</p>',
    ),
    null,
  )
})

test('normalizes numeric invoice strings and rejects unusable invoices', () => {
  const result = normalizeQuoteInvoice(
    {
      data: {
        invoice_id: 120241,
        invoice_subtotal: '379.27',
        invoice_tax: '27.50',
        invoice_total: '406.77',
        location_id: 3,
        pricing_profile_id: '9',
        Items: [
          {
            sku: 'DW01949GTYN',
            description: 'Windshield',
            price: '264.27',
          },
        ],
      },
    },
    '120241',
  )

  assert.deepEqual(result, {
    invoiceId: '120241',
    subtotal: 379.27,
    tax: 27.5,
    total: 406.77,
    locationId: '3',
    pricingProfileId: '9',
    items: [{ sku: 'DW01949GTYN', description: 'Windshield', price: 264.27 }],
  })

  assert.throws(
    () =>
      normalizeQuoteInvoice(
        {
          invoice_tax: 0,
          invoice_total: 0,
          Items: [],
        },
        '120241',
      ),
    OmegaQuoteInvoiceContractError,
  )
})

test('retries only the supplied invoice GET operation', async () => {
  let attempts = 0
  const result = await retryQuoteInvoiceGet(
    async () => {
      attempts += 1
      if (attempts < 3) throw new Error('temporary invoice failure')
      return { invoiceId: '120241' }
    },
    () => true,
    async () => {},
  )

  assert.deepEqual(result, { invoiceId: '120241' })
  assert.equal(attempts, 3)
})

test('requires signed-recovery request fields and strict result DTOs', () => {
  assert.equal(
    quoteRecoveryRequestSchema.safeParse({
      locationSlug: 'layton',
      invoiceId: '120241',
      recoveryToken: '1722999999.signature',
    }).success,
    true,
  )
  assert.equal(
    quoteRecoveryRequestSchema.safeParse({
      locationSlug: 'layton',
      invoiceId: '120241',
    }).success,
    false,
  )
  assert.equal(
    quoteResultSchema.safeParse({
      invoiceId: '120241',
      subtotal: 379.27,
      tax: 27.5,
      total: 406.77,
      locationId: '3',
      pricingProfileId: '9',
      items: [{ sku: null, description: 'Labor', price: 90 }],
      rawHtml: '<p>must not pass</p>',
    }).success,
    false,
  )
  assert.equal(
    insuranceQuoteAcknowledgementSchema.safeParse({
      kind: 'insurance_acknowledgement',
    }).success,
    true,
  )
})

test('builds normalized client submissions and resets all quote data', () => {
  const data = {
    ...initialKioskData,
    customerName: ' Validation ',
    phone: '(801) 555-0100',
    email: '',
    serviceZip: '84041',
    quoteVehicle,
    glassType: 'back',
    glassPosition: 'B',
    quoteServiceMode: 'shop',
    shopLocation: 'layton',
    quotePayType: 'cash',
  }

  assert.deepEqual(buildQuoteSubmission(data, 'layton'), {
    locationSlug: 'layton',
    customer: {
      firstName: 'Validation',
      phone: '(801) 555-0100',
      email: null,
      zip: '84041',
      smsConsent: false,
    },
    vehicle: quoteVehicle,
    glass: { type: 'back', position: 'B' },
    service: {
      mode: 'shop',
      address: null,
      shopLocation: 'layton',
      preferredDate: null,
    },
    payment: { mode: 'cash' },
  })

  assert.equal(initialKioskData.smsConsent, false)
  assert.equal(initialKioskData.quoteVehicle, null)
  assert.equal(initialKioskData.quoteSubmission, null)
  assert.equal(initialKioskData.quoteSubmissionStatus, 'idle')
  assert.equal(initialKioskData.quoteSubmissionError, null)
  assert.equal(initialKioskData.quoteInvoiceId, null)
  assert.equal(initialKioskData.quoteRecoveryToken, null)
  assert.equal(initialKioskData.quoteResult, null)
  assert.equal(initialKioskData.insuranceCompanyId, '')
  assert.equal(initialKioskData.policyNumber, '')
})

test('builds an insurance submission without a deductible', () => {
  const submission = buildQuoteSubmission(
    {
      ...initialKioskData,
      customerName: 'Validation',
      phone: '8015550100',
      serviceZip: '84041',
      quoteVehicle,
      glassType: 'windshield',
      glassPosition: 'W',
      quoteServiceMode: 'shop',
      shopLocation: 'layton',
      quotePayType: 'insurance',
      insuranceCompanyId: '42',
      insuranceCompanyLabel: 'Allstate',
      policyNumber: 'POLICY-123',
      deductibleAmount: '',
    },
    'layton',
  )

  assert.ok(submission)
  assert.equal(submission.payment.mode, 'insurance')
  assert.equal(submission.payment.policyNumber, 'POLICY-123')
  assert.equal(submission.payment.deductible, null)
})
