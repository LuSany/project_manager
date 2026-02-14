import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";

// MSW handlers
export const handlers = [
  // API handlers will be added here
];

// Setup MSW for tests
export async function setupMSW() {
  const worker = setupWorker(...handlers);
  return worker;
}
