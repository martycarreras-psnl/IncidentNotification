import { useState } from 'react';
import {
  Combobox,
  Option,
  Spinner,
  tokens,
} from '@fluentui/react-components';
import { useUserSearch } from '@/hooks/useIncidents';
import type { UserRef } from '@/types/domain-models';

/** Dataverse systemuser people-picker. Debounced search over the user directory. */
export function PeoplePicker({
  value,
  onChange,
  placeholder = 'Search people…',
  ariaLabel,
}: {
  value?: UserRef;
  onChange: (user: UserRef | undefined) => void;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [query, setQuery] = useState('');
  const { data: results, isLoading } = useUserSearch(query);

  return (
    <Combobox
      aria-label={ariaLabel ?? 'People picker'}
      placeholder={placeholder}
      value={value ? value.name : query}
      selectedOptions={value ? [value.id] : []}
      onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
      onOptionSelect={(_e, data) => {
        if (!data.optionValue) {
          onChange(undefined);
          return;
        }
        const picked = results?.find((u) => u.id === data.optionValue);
        onChange(picked);
        setQuery('');
      }}
      clearable
    >
      {isLoading ? (
        <Option value="" text="Loading" disabled>
          <Spinner size="tiny" label="Searching…" />
        </Option>
      ) : (results ?? []).length === 0 ? (
        <Option value="" text="none" disabled>
          <span style={{ color: tokens.colorNeutralForeground3 }}>
            {query.length < 2 ? 'Type to search…' : 'No matches'}
          </span>
        </Option>
      ) : (
        (results ?? []).map((u) => (
          <Option key={u.id} value={u.id} text={u.name}>
            {u.name}
            {u.email ? <span style={{ color: tokens.colorNeutralForeground3 }}> · {u.email}</span> : null}
          </Option>
        ))
      )}
    </Combobox>
  );
}
