// Test stub for @microsoft/power-apps/data. The real SDK has an ESM subpath that
// vitest cannot resolve (multiSelectPicklistUtils), and tests run in mock mode
// (VITE_USE_MOCK=true) so the generated services are never actually called.
export function getClient() {
  const notUsed = () => Promise.reject(new Error('Power SDK client not available in tests (mock mode).'));
  return {
    createRecordAsync: notUsed,
    updateRecordAsync: notUsed,
    deleteRecordAsync: notUsed,
    retrieveRecordAsync: notUsed,
    retrieveMultipleRecordsAsync: notUsed,
    executeAsync: notUsed,
  };
}
