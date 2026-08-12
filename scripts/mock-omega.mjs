import http from 'node:http'

const HOST = '127.0.0.1'
const PORT = readPort(process.env.OMEGA_MOCK_PORT)
const SCENARIO =
  process.env.OMEGA_MOCK_SCENARIO?.trim().toLowerCase() || 'resolved'

const INVOICE_ID = '12345'
const APPOINTMENT_ID = '98765'
const APPOINTMENT_GUID = '00000000-0000-4000'
const LOCATION_ID = '1'

const supportedScenarios = new Set([
  'resolved',
  'too-early',
  'closed',
  'mobile',
  'expired',
  'missing-vehicle',
  'appointment-missing',
  'mismatched-invoice',
])

if (!supportedScenarios.has(SCENARIO)) {
  console.error(
    `Unknown OMEGA_MOCK_SCENARIO "${SCENARIO}". Choose one of: ${[...supportedScenarios].join(', ')}`,
  )
  process.exit(1)
}

const server = http.createServer(async (request, response) => {
  const url = new URL(
    request.url ?? '/',
    `http://${request.headers.host ?? HOST}`,
  )

  console.log(`${request.method ?? 'GET'} ${url.pathname}${url.search}`)

  if (request.method === 'POST' && url.pathname === '/api/2.0/Appointments') {
    const body = await readJsonBody(request, response)
    if (body === null) return

    if (
      body.status !== 'HOLD' ||
      body.invoice_id === undefined ||
      body.location_id === undefined
    ) {
      sendJson(response, 400, {
        error_code: 400,
        message: 'Invalid held appointment payload.',
      })
      return
    }

    sendJson(response, 201, Number(APPOINTMENT_ID))
    return
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, {
      error_code: 405,
      message: 'The local Omega mock only supports GET requests.',
    })
    return
  }

  if (!request.headers.api_key) {
    sendJson(response, 401, {
      error_code: 401,
      message: 'Missing api_key header.',
    })
    return
  }

  if (url.pathname === `/api/2.0/Invoices/${INVOICE_ID}`) {
    sendJson(response, 200, createInvoice())
    return
  }

  if (url.pathname === '/api/2.0/Locations/Quotes/') {
    sendJson(response, 200, [createLocation()])
    return
  }

  if (url.pathname === '/api/2.0/Locations/search/') {
    sendJson(response, 200, [
      {
        ...createLocation(),
        distance: '3.5',
        serviced: true,
        serviced_postal_code: url.searchParams.get('postal_code'),
      },
    ])
    return
  }

  if (url.pathname === `/api/2.0/Locations/${LOCATION_ID}`) {
    sendJson(response, 200, createLocation())
    return
  }

  if (url.pathname === `/api/2.0/Locations/${LOCATION_ID}/AppointmentSlots`) {
    sendJson(
      response,
      200,
      createAppointmentSlots(url.searchParams.get('type')),
    )
    return
  }

  if (url.pathname.startsWith('/api/2.0/Invoices/')) {
    sendJson(response, 404, {
      error_code: 404,
      message: 'Invoice not found.',
    })
    return
  }

  sendJson(response, 404, {
    error_code: 404,
    message: 'Mock endpoint not found.',
  })
})

server.listen(PORT, HOST, () => {
  console.log('')
  console.log(`Omega mock listening at http://${HOST}:${PORT}/api/2.0`)
  console.log(`Scenario: ${SCENARIO}`)
  console.log(
    `Check-in URL: http://localhost:3000/check-in?appointment=${APPOINTMENT_GUID}&id=${INVOICE_ID}`,
  )
  console.log('')
  console.log('Press Ctrl+C to stop the mock server.')
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Is the Omega mock already running?`,
    )
  } else {
    console.error('Omega mock server failed:', error)
  }

  process.exit(1)
})

function createInvoice() {
  const vehicle =
    SCENARIO === 'missing-vehicle'
      ? {
          vehicle_year: null,
          vehicle_make: null,
          vehicle_model: null,
          vehicle_description: null,
        }
      : {
          vehicle_year: '2022',
          vehicle_make: 'Honda',
          vehicle_model: 'CR-V',
          vehicle_description: 'Blue',
        }

  return {
    id: INVOICE_ID,
    customer_fname: 'Maya',
    customer_surname: 'Reynolds',
    customer_phone: '801-555-0147',
    ...vehicle,
    Appointments:
      SCENARIO === 'appointment-missing' ? [] : [createAppointment()],
  }
}

function createAppointment() {
  const now = Math.floor(Date.now() / 1000)
  const startTime =
    SCENARIO === 'too-early'
      ? now + 2 * 60 * 60
      : SCENARIO === 'expired'
        ? now - 4 * 60 * 60
        : now + 30 * 60

  return {
    id: APPOINTMENT_ID,
    guid: APPOINTMENT_GUID,
    invoice_id: SCENARIO === 'mismatched-invoice' ? '99999' : INVOICE_ID,
    location_id: LOCATION_ID,
    start_time: startTime,
    end_time: startTime + 60 * 60,
    status: SCENARIO === 'closed' ? 'CLOSED' : 'OPEN',
    type: SCENARIO === 'mobile' ? 'mobile' : 'inshop',
  }
}

function createLocation() {
  return {
    id: Number(LOCATION_ID),
    name: 'Layton',
    timezone: 'America/Denver',
    active: '1',
  }
}

function createAppointmentSlots(type) {
  const now = new Date()
  const windows =
    type === 'inshop'
      ? [
          { start: '08:00', end: '10:00' },
          { start: '10:00', end: '12:00' },
        ]
      : [
          { start: '07:00', end: '12:00' },
          { start: '12:00', end: '18:00' },
        ]

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now)
    date.setUTCDate(now.getUTCDate() + index + 1)

    return {
      date: date.toISOString().slice(0, 10),
      capacity: 6,
      appointments: 2,
      Hours: { open_time: '07:00', close_time: '18:00' },
      appointment_slots: windows,
    }
  })
}

async function readJsonBody(request, response) {
  const chunks = []

  for await (const chunk of request) chunks.push(chunk)

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    sendJson(response, 400, {
      error_code: 400,
      message: 'Invalid JSON body.',
    })
    return null
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(body))
}

function readPort(value) {
  const port = Number(value ?? 4010)

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('OMEGA_MOCK_PORT must be an integer between 1 and 65535.')
    process.exit(1)
  }

  return port
}
