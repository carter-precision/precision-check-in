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
  classifyOmegaQuoteHtml,
  extractOmegaQuoteBootstrapGuid,
  extractQuoteInvoiceId,
  extractQuoteTotal,
} from '../lib/omega/quote-invoice.ts'
import {
  buildOmegaQuoteCompletionRequest,
  buildOmegaQuoteRequest,
  getServerGlassPosition,
  quoteSubmissionSchema,
  requiresCashQuoteResult,
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
    campaign: 'WEB QUOTE',
    lead_type: 'web_lead',
  })

  for (const forbidden of [
    'customer_surname',
    'include_recal',
    'template_id',
    'vehicle_plate_no',
    'vehicle_plate_state',
    'vehicle_vin',
    'opening',
    'medium',
  ]) {
    assert.equal(request.query.has(forbidden), false)
  }
})

test('builds the observed cash completion request with the Omega GUID', () => {
  const guid = '9D618EDE-9E9B-49F3-AD6B-3D62DF64D263'
  const request = buildOmegaQuoteCompletionRequest(cashSubmission, guid)

  assert.equal(request.path, '/Quotes/66687/W')
  assert.deepEqual(request.query.getAll('smart'), ['true', ''])
  assert.equal(request.query.get('guid'), guid)
  assert.equal(request.query.get('vehicle_vin'), validVin)
  assert.equal(request.query.get('vehicle_plate_no'), '')
  assert.equal(request.query.get('vehicle_plate_state'), '')
  assert.equal(request.query.get('opening'), 'W')
  assert.equal(request.query.get('medium'), 'web_quote')
  assert.equal(request.query.get('lead_type'), 'web_lead')
  assert.equal(
    buildOmegaQuoteCompletionRequest(
      {
        ...cashSubmission,
        vehicle: { ...cashSubmission.vehicle, vin: null },
      },
      guid,
    ).query.get('vehicle_vin'),
    '',
  )
  assert.throws(() =>
    buildOmegaQuoteCompletionRequest(cashSubmission, 'not-a-guid'),
  )
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
  assert.equal(requiresCashQuoteResult('insurance'), false)
  assert.equal(requiresCashQuoteResult('cash'), true)
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
  assert.equal(
    extractQuoteInvoiceId(
      '<script>const invoicePath = "/Invoice/999999"</script>',
    ),
    null,
  )
})

test('classifies Omega bootstrap meta refreshes and final quote HTML', () => {
  const guid = '9D618EDE-9E9B-49F3-AD6B-3D62DF64D263'
  const bootstrapHtml = `<meta content="0; url=/quoter/vin.php?year=2017&amp;guid=${guid}" http-equiv="refresh">`

  assert.equal(extractOmegaQuoteBootstrapGuid(bootstrapHtml), guid)
  assert.equal(
    extractOmegaQuoteBootstrapGuid(
      `<meta http-equiv='REFRESH' content='0; URL=&quot;/quoter/vin.php?guid=${guid}&quot;'>`,
    ),
    guid,
  )
  assert.deepEqual(classifyOmegaQuoteHtml(bootstrapHtml), {
    kind: 'bootstrap',
    guid,
  })
  assert.deepEqual(
    classifyOmegaQuoteHtml(
      '<html><body><p>Precision Auto Glass Quote #120698</p><span class="price">$379.27<br /></span></body></html>',
    ),
    { kind: 'final', invoiceId: '120698', total: 379.27 },
  )
  assert.deepEqual(
    classifyOmegaQuoteHtml(
      '<p>Precision Auto Glass Quote #120698</p><span>No price</span>',
    ),
    { kind: 'invalid' },
  )
  assert.deepEqual(
    classifyOmegaQuoteHtml('<span class="price">$379.27</span>'),
    { kind: 'invalid' },
  )
})

test('rejects untrusted or ambiguous Omega bootstrap refreshes', () => {
  const guid = '9D618EDE-9E9B-49F3-AD6B-3D62DF64D263'

  for (const html of [
    `<meta http-equiv="refresh" content="0; url=https://example.com/quoter/vin.php?guid=${guid}">`,
    `<meta http-equiv="refresh" content="0; url=/another/path?guid=${guid}">`,
    '<meta http-equiv="refresh" content="0; url=/quoter/vin.php?guid=bad">',
    `<meta http-equiv="refresh" content="0; url=/quoter/vin.php?guid=${guid}&guid=${guid}">`,
    `<script><meta http-equiv="refresh" content="0; url=/quoter/vin.php?guid=${guid}"></script>`,
    `<meta http-equiv="refresh" content="0; url=/quoter/vin.php?guid=${guid}"><meta http-equiv="refresh" content="0; url=/quoter/vin.php?guid=${guid}">`,
  ]) {
    assert.equal(extractOmegaQuoteBootstrapGuid(html), null)
    assert.deepEqual(classifyOmegaQuoteHtml(html), { kind: 'invalid' })
  }
})

test('extracts only the primary price element from final quote HTML', () => {
  assert.equal(
    extractQuoteTotal(
      '<span class="price featured">$379.27<br /></span><strong>$94.82</strong>',
    ),
    379.27,
  )
  assert.equal(
    extractQuoteTotal('<span class="price">$1,379.27</span>'),
    1379.27,
  )
  assert.equal(
    extractQuoteTotal('<script><span class="price">$999.99</span></script>'),
    null,
  )
  assert.equal(extractQuoteTotal('<span class="price">$0.00</span>'), null)
  assert.equal(extractQuoteTotal('<span>$379.27</span>'), null)
})

test('requires a strict total-only result DTO', () => {
  assert.equal(
    quoteResultSchema.safeParse({
      invoiceId: '120241',
      total: 379.27,
    }).success,
    true,
  )
  assert.equal(
    quoteResultSchema.safeParse({
      invoiceId: '120241',
      total: 379.27,
      tax: 27.5,
    }).success,
    false,
  )
  assert.equal(
    quoteResultSchema.safeParse({
      invoiceId: '120241',
      total: 406.77,
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
