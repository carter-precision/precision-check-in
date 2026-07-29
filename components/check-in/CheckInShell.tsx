import { CalendarClock, CircleAlert } from 'lucide-react'

export function CheckInShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg">
        <section>{children}</section>
      </div>
    </main>
  )
}

export function CheckInUnavailable() {
  return (
    <CheckInShell>
      <CheckInUnavailableContent />
    </CheckInShell>
  )
}

export function CheckInUnavailableContent() {
  return (
    <div className="py-7 text-center">
      <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-[#fff4e5] text-[#a56a13]">
        <CircleAlert className="size-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
        We couldn't find your appointment
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
        Please head inside and check in at the kiosk. Our team will be happy to
        help you.
      </p>
    </div>
  )
}

export function CheckInTooEarly({
  appointmentStart,
}: {
  appointmentStart: number
}) {
  return (
    <CheckInShell>
      <CheckInTooEarlyContent appointmentStart={appointmentStart} />
    </CheckInShell>
  )
}

export function CheckInTooEarlyContent({
  appointmentStart,
}: {
  appointmentStart: number
}) {
  return (
    <div className="flex flex-col items-center py-7 text-center">
      <div className="w-fit px-4 py-2 mb-4 flex items-center justify-center gap-4 text-left rounded-2xl border border-[#dce7d5] bg-accent-tint">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent-tint text-accent">
          <CalendarClock className="size-10 stroke-[1.8px]" />
        </div>
        <div className="w-fit min-w-48">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-accent">
            Scheduled appointment
          </span>
          <time
            dateTime={new Date(appointmentStart).toISOString()}
            className="mt-1 block text-2xl font-bold tracking-[-0.03em] text-[#16262f]"
          >
            {formatMountainTime(appointmentStart)}
          </time>
        </div>
      </div>
      <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f]">
        Check-in isn't open yet
      </h1>
      <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
        You may check in up to 15 minutes before your appointment. See you then!
      </p>
    </div>
  )
}

function formatMountainTime(timestamp: number) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Denver',
    timeZoneName: 'short',
  }).format(timestamp)
}
