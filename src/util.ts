/**
 * Utility function for throwing a consistent error if a fetch request failed.
 * @param response Fetch response.
 * @param errorMessage Error to throw if the response was a failure.
 */
export async function throwIfNotOkay(response: Response, errorMessage: string) {
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`${errorMessage}: ${response.statusText}\n${responseBody}`);
  }
}
/**
 * Utility function for removing duplicates from an array.
 * @param values Array of values to remove duplicates from.
 */
export function removeDuplicates<T>(values: T[]): T[] {
  const result: T[] = [];

  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }

  return result;
}

export function log(...values: any[]): void {
  console.log(`[${new Date().toLocaleString()}] `, ...values);
}
export function logWarning(...values: any[]): void {
  console.warn(`[${new Date().toLocaleString()}] `, ...values);
}
export function logError(...values: any[]): void {
  console.error(`[${new Date().toLocaleString()}] `, ...values);
}