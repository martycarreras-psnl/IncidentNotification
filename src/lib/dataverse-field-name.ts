// Every custom column uses the publisher prefix + the domain key lowercased.
// Columns that break the convention must pass an explicit `fieldLogicalName`.

export const DATAVERSE_PREFIX = 'msftirma_';

export function toDataverseFieldName(key: string | undefined | null): string | undefined {
  if (!key) return undefined;
  if (key.startsWith(DATAVERSE_PREFIX)) return key.toLowerCase();
  return `${DATAVERSE_PREFIX}${key.toLowerCase()}`;
}
