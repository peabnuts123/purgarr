export async function throwIfNotOkay(response: Response, errorMessage: string) {
  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(`${errorMessage}: ${response.statusText}\n${responseBody}`);
  }
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