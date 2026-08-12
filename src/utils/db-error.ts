// drizzle-orm wraps the real postgres error inside DrizzleQueryError.cause —
// error.code on the caught error is always undefined, the real Postgres error code lives at error.cause.code
export function pgErrorCode(error: any): string | undefined {
  return error?.code ?? error?.cause?.code
}
