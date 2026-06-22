// Shared singleton data provider. Hooks and components import this rather than
// constructing their own provider, so mock/real selection happens in one place.
import type { AppDataProvider } from '@/services/data-contracts';
import { createAppDataProvider } from '@/services/providerFactory';

let provider: AppDataProvider | undefined;

export function getDataProvider(): AppDataProvider {
  if (!provider) provider = createAppDataProvider();
  return provider;
}
