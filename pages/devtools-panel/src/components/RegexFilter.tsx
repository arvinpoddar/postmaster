import { CaseSensitiveIcon, RegexIcon } from 'lucide-react';
import { useCallback, useState, type ComponentPropsWithoutRef } from 'react';
import { clsx as cn } from 'clsx';

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  onFilterChange: (value: RegExp) => void;
};

export function RegexFilter({
  value,
  onValueChange,
  onFilterChange,
  ...props
}: Props & ComponentPropsWithoutRef<'input'>) {
  const [matchCase, setMatchCase] = useState(false);
  const [matchRegex, setMatchRegex] = useState(false);

  const constructFilter = useCallback(
    (value: string, matchCase: boolean, useRegex: boolean) => {
      const flags = matchCase ? 'g' : 'gi';
      const regex = useRegex
        ? new RegExp(value, flags)
        : new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      onFilterChange(regex);
    },
    [onFilterChange],
  );

  return (
    <div className="flex w-full flex-1 items-center gap-1 rounded border border-zinc-400 bg-zinc-200 text-zinc-700 focus-within:border-blue-500 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:focus-within:border-blue-400">
      <input
        {...props}
        className="ml-1 flex-1 bg-transparent outline-none dark:bg-transparent"
        value={value}
        onChange={e => {
          onValueChange(e.target.value);
          constructFilter(e.target.value, matchCase, matchRegex);
        }}
      />
      <div className="m-[2px] flex gap-[2px]">
        <button
          onClick={() => {
            constructFilter(value, !matchCase, matchRegex);
            setMatchCase(v => !v);
          }}
          title="Case sensitive"
          className={cn(
            'rounded p-[2px] hover:bg-zinc-300 dark:hover:bg-zinc-600',
            matchCase && 'bg-zinc-300 dark:bg-zinc-600 text-blue-500 dark:text-blue-400',
          )}>
          <CaseSensitiveIcon size={14} />
        </button>
        <button
          onClick={() => {
            constructFilter(value, matchCase, !matchRegex);
            setMatchRegex(v => !v);
          }}
          title="Use RegEx"
          className={cn(
            'rounded p-[2px] hover:bg-zinc-300 dark:hover:bg-zinc-600',
            matchRegex && 'bg-zinc-300 dark:bg-zinc-600 text-blue-500 dark:text-blue-400',
          )}>
          <RegexIcon size={14} />
        </button>
      </div>
    </div>
  );
}
