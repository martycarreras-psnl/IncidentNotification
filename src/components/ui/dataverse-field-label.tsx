import * as React from 'react';
import { Label, tokens } from '@fluentui/react-components';
import { useDataverseFieldMetadata } from '@/hooks/use-dataverse-field-metadata';

type Props = React.ComponentProps<typeof Label> & {
  /** Dataverse table logical name (e.g. `msftirma_incident`). Omit for client-only fields. */
  tableLogicalName?: string;
  /** Dataverse column logical name (e.g. `msftirma_narrative`). Omit for client-only fields. */
  fieldLogicalName?: string;
  /** Display text to use when metadata is not available. */
  fallback?: string;
  /** Force the required indicator for client-only fields that are not Dataverse-backed. */
  required?: boolean;
};

export function DataverseFieldLabel({
  tableLogicalName,
  fieldLogicalName,
  fallback,
  required,
  children,
  ...rest
}: Props) {
  const { data } = useDataverseFieldMetadata(tableLogicalName ?? '', fieldLogicalName ?? '');
  const text = data?.displayName ?? fallback ?? children;
  const isRequired = data?.isRequired ?? required ?? false;
  return (
    <Label {...rest}>
      {text}
      {isRequired ? (
        <span aria-hidden="true" style={{ marginLeft: 2, color: tokens.colorPaletteRedForeground1 }}>
          *
        </span>
      ) : null}
    </Label>
  );
}

export function useDataverseFieldRequired(
  tableLogicalName: string | undefined,
  fieldLogicalName: string | undefined,
  fallback?: boolean,
): boolean {
  const { data } = useDataverseFieldMetadata(tableLogicalName ?? '', fieldLogicalName ?? '');
  return data?.isRequired ?? fallback ?? false;
}
