const OMEGA_CAMPAIGNS = {
  layton: {
    cash: 'Lobby Layton',
    insurance: 'Lobby Layton Ins',
  },
  centerville: {
    cash: 'Lobby Centerville',
    insurance: 'Lobby Centerville Ins',
  },
  ogden: {
    cash: 'Lobby Ogden',
    insurance: 'Lobby Ogden Ins',
  },
  'south-jordan': {
    cash: 'Lobby South Jordan',
    insurance: 'Lobby South Jordan Ins',
  },
  'cedar-city': {
    cash: 'Lobby Cedar City',
    insurance: 'Lobby Cedar City Ins',
  },
  'st-george': {
    cash: 'Lobby St George',
    insurance: 'Lobby St George Ins',
  },
} as const

type LegacyOmegaQuoteType = 'cash' | 'insurance' | 'rock-chip'

export function getLegacyOmegaQuoteUrl({
  location,
  type,
}: {
  location: string
  type: LegacyOmegaQuoteType
}) {
  const campaigns = OMEGA_CAMPAIGNS[location as keyof typeof OMEGA_CAMPAIGNS]

  if (!campaigns) {
    throw new Error(`Missing Omega campaigns for ${location}`)
  }

  switch (type) {
    case 'insurance': {
      const params = new URLSearchParams({
        folder: 'pag',
        campaign: campaigns.insurance,
        smart: 'true',
        include_recal: 'true',
        template_id: '136',
      })

      return `https://app.omegaedi.com/quoter15/?${params.toString()}`
    }

    case 'cash': {
      const params = new URLSearchParams({
        folder: 'pag',
        campaign: campaigns.cash,
        smart: 'true',
        include_recal: 'true',
      })

      return `https://app.omegaedi.com/quoter/?${params.toString()}`
    }

    case 'rock-chip': {
      const params = new URLSearchParams({
        folder: 'pag',
        campaign: campaigns.cash,
        smart: 'true',
      })

      return `https://app.omegaedi.com/quoter14/?${params.toString()}`
    }
  }
}
