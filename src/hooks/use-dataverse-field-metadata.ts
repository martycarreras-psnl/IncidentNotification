import { useQuery } from '@tanstack/react-query';
import { getDataProvider } from '@/services/provider';

const provider = getDataProvider();

export function useDataverseFieldMetadata(tableLogicalName: string, fieldLogicalName: string) {
  return useQuery({
    queryKey: ['fieldMetadata', tableLogicalName, fieldLogicalName],
    enabled: !!tableLogicalName && !!fieldLogicalName,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: () => provider.fieldMetadata.getField(tableLogicalName, fieldLogicalName),
  });
}
