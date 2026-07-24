import http from "node:http"

const HOST = "127.0.0.1"
const PORT = readPort(process.env.OMEGA_MOCK_PORT)
const SCENARIO = process.env.OMEGA_MOCK_SCENARIO?.trim().toLowerCase() || "resolved"

const INVOICE_ID = "12345"
const APPOINTMENT_ID = "98765"
const APPOINTMENT_GUID = "00000000-0000-4000-8000-000000000001"
const LOCATION_ID = "1"

const supportedScenarios = new Set([
    "resolved",
    "too-early",
    "closed",
    "mobile",
    "expired",
    "missing-vehicle",
    "appointment-missing",
    "mismatched-invoice",
])

if (!supportedScenarios.has(SCENARIO)) {
    console.error(
        `Unknown OMEGA_MOCK_SCENARIO "${SCENARIO}". Choose one of: ${[...supportedScenarios].join(", ")}`,
    )
    process.exit(1)
}

const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? HOST}`)

    console.log(`${request.method ?? "GET"} ${url.pathname}${url.search}`)

    if (request.method !== "GET") {
        sendJson(response, 405, {
            error_code: 405,
            message: "The local Omega mock only supports GET requests.",
        })
        return
    }

    if (!request.headers.api_key) {
        sendJson(response, 401, {
            error_code: 401,
            message: "Missing api_key header.",
        })
        return
    }

    if (url.pathname === `/api/2.0/Invoices/${INVOICE_ID}`) {
        sendJson(response, 200, createInvoice())
        return
    }

    if (url.pathname.startsWith("/api/2.0/Invoices/")) {
        sendJson(response, 404, {
            error_code: 404,
            message: "Invoice not found.",
        })
        return
    }

    if (url.pathname === "/api/2.0/Appointments") {
        const range = readAppointmentRange(url.searchParams)

        if (!range) {
            sendJson(response, 400, {
                error_code: 400,
                message: "date1 and date2 must be Unix timestamps in seconds or milliseconds.",
            })
            return
        }

        if (SCENARIO === "appointment-missing") {
            sendJson(response, 200, [])
            return
        }

        const appointment = createAppointment()
        const appointmentStartsAt = normalizeUnixTimestamp(appointment.start_time)
        const isInRequestedRange =
            appointmentStartsAt >= range.dateFrom && appointmentStartsAt <= range.dateTo

        sendJson(response, 200, isInRequestedRange ? [appointment] : [])
        return
    }

    sendJson(response, 404, {
        error_code: 404,
        message: "Mock endpoint not found.",
    })
})

server.listen(PORT, HOST, () => {
    console.log("")
    console.log(`Omega mock listening at http://${HOST}:${PORT}/api/2.0`)
    console.log(`Scenario: ${SCENARIO}`)
    console.log(
        `Check-in URL: http://localhost:3000/check-in?appointment_guid=${APPOINTMENT_GUID}&invoice_id=${INVOICE_ID}`,
    )
    console.log("")
    console.log("Press Ctrl+C to stop the mock server.")
})

server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Is the Omega mock already running?`)
    } else {
        console.error("Omega mock server failed:", error)
    }

    process.exit(1)
})

function createInvoice() {
    const vehicle =
        SCENARIO === "missing-vehicle"
            ? {
                  vehicle_year: null,
                  vehicle_make: null,
                  vehicle_model: null,
                  vehicle_description: null,
              }
            : {
                  vehicle_year: "2024",
                  vehicle_make: "Toyota",
                  vehicle_model: "Camry",
                  vehicle_description: "White",
              }

    return {
        customer_fname: "Michael",
        customer_surname: "Example",
        customer_phone: "555-555-1234",
        ...vehicle,
    }
}

function createAppointment() {
    const now = Math.floor(Date.now() / 1000)
    const startTime =
        SCENARIO === "too-early"
            ? now + 2 * 60 * 60
            : SCENARIO === "expired"
              ? now - 4 * 60 * 60
              : now + 30 * 60

    return {
        id: APPOINTMENT_ID,
        guid: APPOINTMENT_GUID,
        invoice_id: SCENARIO === "mismatched-invoice" ? "99999" : INVOICE_ID,
        location_id: LOCATION_ID,
        start_time: startTime,
        end_time: startTime + 60 * 60,
        status: SCENARIO === "closed" ? "CLOSED" : "OPEN",
        type: SCENARIO === "mobile" ? "mobile" : "inshop",
    }
}

function readAppointmentRange(searchParams) {
    const dateFrom = normalizeUnixTimestamp(searchParams.get("date1"))
    const dateTo = normalizeUnixTimestamp(searchParams.get("date2"))

    if (!Number.isFinite(dateFrom) || !Number.isFinite(dateTo) || dateFrom > dateTo) {
        return null
    }

    return { dateFrom, dateTo }
}

function normalizeUnixTimestamp(value) {
    const timestamp = Number(value)

    if (!Number.isFinite(timestamp)) return Number.NaN

    return timestamp >= 1_000_000_000_000 ? Math.floor(timestamp / 1000) : timestamp
}

function sendJson(response, statusCode, body) {
    response.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
    })
    response.end(JSON.stringify(body))
}

function readPort(value) {
    const port = Number(value ?? 4010)

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error("OMEGA_MOCK_PORT must be an integer between 1 and 65535.")
        process.exit(1)
    }

    return port
}
