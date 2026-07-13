const OMEGA_CAMPAIGNS = {
    layton: {
        cash: "Lobby Layton",
        insurance: "Lobby Layton Ins",
        rockChip: "Lobby Layton",
    },
    centerville: {
        cash: "Lobby Centerville",
        insurance: "Lobby Centerville Ins",
        rockChip: "Lobby Centerville",
    },
    ogden: {
        cash: "Lobby Ogden",
        insurance: "Lobby Ogden Ins",
        rockChip: "Lobby Ogden",
    },
    "south-jordan": {
        cash: "Lobby South Jordan",
        insurance: "Lobby South Jordan Ins",
        rockChip: "Lobby South Jordan",
    },
    "cedar-city": {
        cash: "Lobby Cedar City",
        insurance: "Lobby Cedar City Ins",
        rockChip: "Lobby Cedar City",
    },
    "st-george": {
        cash: "Lobby St George",
        insurance: "Lobby St George Ins",
        rockChip: "Lobby St George",
    },
} as const

export type OmegaQuoteType = "cash" | "insurance" | "rockChip"

export function getOmegaQuoteUrl({
    location,
    type,
}: {
    location: string
    type: OmegaQuoteType
}) {
    const campaigns = OMEGA_CAMPAIGNS[location as keyof typeof OMEGA_CAMPAIGNS]

    if (!campaigns) {
        throw new Error(`Missing Omega campaigns for ${location}`)
    }

    switch (type) {
        case "insurance": {
            const params = new URLSearchParams({
                folder: "pag",
                campaign: campaigns.insurance,
                smart: "true",
                include_recal: "true",
                template_id: "136",
            })

            return `https://app.omegaedi.com/quoter15/?${params.toString()}`
        }
        case "cash": {
            const params = new URLSearchParams({
                folder: "pag",
                campaign: campaigns.cash,
                smart: "true",
                include_recal: "true",
            })

            return `https://app.omegaedi.com/quoter/?${params.toString()}`
        }
        case "rockChip": {
            const params = new URLSearchParams({
                folder: "pag",
                campaign: campaigns.rockChip,
                smart: "true",
            })

            return `https://app.omegaedi.com/quoter14/?${params.toString()}`
        }
    }
}
