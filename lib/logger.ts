export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true'

export function debugLog(...args: unknown[]) {
  if (DEBUG) {
    // eslint-disable-next-line no-console
    console.log(...args)
  }
}
