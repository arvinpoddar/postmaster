import { useCallback, useEffect, useState } from 'react';
import { RegexFilterInput } from './RegexFilterInput';
import type { PostMessage } from '@extension/shared';
import { clsx as cn } from 'clsx';

export type FilterFunction = (message: PostMessage) => boolean;

type Props = {
  onFilterChange: (value: FilterFunction | null) => void;
  className?: string;
  originPlaceholder?: string;
  destinationPlaceholder?: string;
  dataPlaceholder?: string;
};

export function RegexFilter({
  onFilterChange,
  className,
  originPlaceholder,
  destinationPlaceholder,
  dataPlaceholder,
}: Props) {
  const [originFilterExpression, setOriginFilterExpression] = useState<RegExp | null>(null);
  const [destinationFilterExpression, setDestinationFilterExpression] = useState<RegExp | null>(null);
  const [dataFilterExpression, setDataFilterExpression] = useState<RegExp | null>(null);

  const filterFunction = useCallback(
    (message: PostMessage) => {
      function matchOriginFilter(message: PostMessage) {
        if (originFilterExpression == null) return true;
        return originFilterExpression.test(message.origin);
      }

      function matchDestinationFilter(message: PostMessage) {
        if (destinationFilterExpression == null) return true;
        return destinationFilterExpression.test(message.destination);
      }

      function matchDataFilter(message: PostMessage) {
        if (dataFilterExpression == null) return true;
        return dataFilterExpression.test(JSON.stringify(message.data));
      }

      return matchOriginFilter(message) && matchDestinationFilter(message) && matchDataFilter(message);
    },
    [originFilterExpression, destinationFilterExpression, dataFilterExpression],
  );

  const hasFilter =
    originFilterExpression != null || destinationFilterExpression != null || dataFilterExpression != null;

  useEffect(() => {
    onFilterChange(hasFilter ? filterFunction : null);
  }, [onFilterChange, filterFunction, hasFilter]);

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-1 border-zinc-300 bg-zinc-100 px-1 py-[6px] dark:border-zinc-600 dark:bg-zinc-800',
        className,
      )}>
      <div className="flex gap-1">
        <RegexFilterInput
          onFilterChange={filter => setOriginFilterExpression(filter)}
          placeholder={originPlaceholder ?? 'Origin'}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />

        <RegexFilterInput
          onFilterChange={filter => setDestinationFilterExpression(filter)}
          placeholder={destinationPlaceholder ?? 'Destination'}
        />
      </div>
      <RegexFilterInput
        onFilterChange={filter => setDataFilterExpression(filter)}
        placeholder={dataPlaceholder ?? 'Data'}
      />
    </div>
  );
}
