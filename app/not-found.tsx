import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'The page you requested could not be found.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9f9] px-5 py-12">
      <section className="relative w-full max-w-lg rounded-[2rem] border border-[#e4eaeb] bg-white px-7 py-10 text-center shadow-sm sm:px-12 sm:py-12">
        <p className="mb-2 text-xl font-bold tracking-[0.12em] text-accent uppercase">
          Error 404
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.04em] text-[#16262f] sm:text-4xl">
          This page isn't here
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-lg font-medium leading-relaxed text-muted-foreground">
          The address may be incorrect, or the page may have moved.
        </p>
      </section>
    </main>
  )
}
