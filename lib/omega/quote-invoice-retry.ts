export async function retryQuoteInvoiceGet<TResult>(
  requestInvoice: () => Promise<TResult>,
  shouldRetry: (error: unknown) => boolean,
  waitAfterFailure: (failedAttempt: number) => Promise<void>,
  maximumAttempts = 3,
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    try {
      return await requestInvoice()
    } catch (error) {
      lastError = error

      if (!shouldRetry(error) || attempt === maximumAttempts) {
        break
      }

      await waitAfterFailure(attempt)
    }
  }

  throw lastError
}
