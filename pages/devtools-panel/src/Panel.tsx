import { type PostMessage, withErrorBoundary, withSuspense } from '@extension/shared';
import dayjs from 'dayjs';
import { useCallback, useState } from 'react';
import {
  PauseIcon,
  PlayIcon,
  SortAscIcon,
  SortDescIcon,
  BanIcon,
  InboxIcon,
  FilterXIcon,
  FilterIcon,
  SparklesIcon,
  SparkleIcon,
  LoaderIcon,
  CircleXIcon,
  ArrowRightIcon,
  SearchIcon,
  SearchXIcon,
} from 'lucide-react';
import type { FilterFunction } from './components/RegexFilter';
import { RegexFilter } from './components/RegexFilter';

type Props = {
  messages: PostMessage[];
  onClear: () => void;
  paused: boolean;
  onTogglePause: () => void;
  onFilterFunctionChange: (filterFunction: FilterFunction | null) => void;
};

const buttonClass = 'rounded p-1 text-zinc-700 hover:bg-zinc-200 dark:text-zinc-300 dark:hover:bg-zinc-700';

function Panel({ messages, paused, onClear, onTogglePause, onFilterFunctionChange }: Props) {
  const [sortAscending, setSortAscending] = useState(false);
  const [prettifyJson, setPrettifyJson] = useState(true);

  const [showFilters, setShowFilters] = useState(false);
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFunction, setSearchFunction] = useState<FilterFunction | null>(null);

  function handleFilterToggle(show: boolean) {
    setShowFilters(show);
    if (!show) onFilterFunctionChange(null);
  }

  function handleSearchToggle(show: boolean) {
    setShowSearchFilters(show);
    if (!show) setSearchFunction(null);
  }

  const formatJson = useCallback(
    (data: unknown) => {
      if (prettifyJson) {
        return JSON.stringify(data, null, 2);
      }
      return JSON.stringify(data);
    },
    [prettifyJson],
  );

  const sortedMessages = messages
    .slice()
    .sort((a, b) => {
      const diff = a.timestamp - b.timestamp;
      return sortAscending ? diff : -diff;
    })
    .filter(message => searchFunction == null || searchFunction(message));

  const hasSearchFilter = searchFunction != null;

  return (
    <div className="flex h-screen w-full flex-col items-center overflow-hidden">
      <div className="flex w-full items-center gap-3 border-b border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-600 dark:bg-zinc-800">
        <div className="flex flex-1 items-center gap-1">
          <button
            className={buttonClass}
            title={hasSearchFilter ? 'Clear search' : 'Search'}
            onClick={() => handleSearchToggle(!showSearchFilters)}>
            {showSearchFilters ? <SearchXIcon size={14} /> : <SearchIcon size={14} />}
          </button>
          <p className="text-zinc-700 dark:text-zinc-300">
            {hasSearchFilter ? (
              <span>
                {sortedMessages.length} matching ({messages.length} total)
              </span>
            ) : (
              <span>{messages.length} messages</span>
            )}
          </p>
        </div>

        <div className="flex gap-1">
          <button
            className={buttonClass}
            title={prettifyJson ? 'Disable prettify' : 'Enable prettify'}
            onClick={() => setPrettifyJson(v => !v)}>
            {prettifyJson ? <SparkleIcon size={14} /> : <SparklesIcon size={14} />}
          </button>

          <button
            className={buttonClass}
            title={showFilters ? 'Clear filters' : 'Add filters'}
            onClick={() => handleFilterToggle(!showFilters)}>
            {showFilters ? <FilterXIcon size={14} /> : <FilterIcon size={14} />}
          </button>

          <button
            className={buttonClass}
            title={sortAscending ? 'Oldest first' : 'Newest first'}
            onClick={() => setSortAscending(!sortAscending)}>
            {sortAscending ? <SortAscIcon size={14} /> : <SortDescIcon size={14} />}
          </button>

          <button
            className={buttonClass}
            onClick={() => onTogglePause()}
            title={paused ? 'Start listening' : 'Pause listening'}>
            {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
          </button>

          <button className={buttonClass} title={'Clear log'} onClick={onClear}>
            <BanIcon size={14} />
          </button>
        </div>
      </div>

      {showSearchFilters && (
        <RegexFilter
          className="border-b"
          onFilterChange={filter => setSearchFunction(() => filter)}
          originPlaceholder="Search by origin"
          destinationPlaceholder="Search by destination"
          dataPlaceholder="Search by data"
        />
      )}

      <div className="min-h-0 w-full flex-1 overflow-y-auto bg-zinc-100 text-sm dark:bg-zinc-800">
        {sortedMessages.map((message, index) => (
          <div key={index} className="w-full border-b border-zinc-600 px-1 py-[10px] text-sm">
            <div className="mb-2 font-mono text-xs text-zinc-700 dark:text-zinc-200">
              {dayjs(message.datetime).format('YYYY-MM-DD HH:mm:ss')} (+{message.timestamp.toFixed()}ms)
            </div>

            <div className="mb-2 truncate font-mono text-xs font-bold text-zinc-700 dark:text-zinc-200">
              <span title={message.origin}>{message.origin}</span>
              <ArrowRightIcon size={16} className="mx-1 inline" />
              <span title={message.destination}>{message.destination}</span>
            </div>

            <code className="font-mono text-xs text-zinc-700 dark:text-zinc-200">
              <pre className="w-full whitespace-pre-wrap break-words">{formatJson(message.data)}</pre>
            </code>
          </div>
        ))}

        {sortedMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-zinc-500">
            <div>
              <InboxIcon size={48} className="mb-2" />
            </div>
            <div>
              <p>No matching messages</p>
            </div>
          </div>
        )}
      </div>

      {showFilters && (
        <RegexFilter
          className="border-t"
          onFilterChange={filter => onFilterFunctionChange(filter)}
          originPlaceholder="Filter by origin"
          destinationPlaceholder="Filter by destination"
          dataPlaceholder="Filter by data"
        />
      )}
    </div>
  );
}

export default withErrorBoundary(
  withSuspense(
    Panel,
    <div className="flex h-full flex-col items-center justify-center text-zinc-500">
      <div>
        <LoaderIcon size={48} className="mb-2 animate-spin duration-1000" />
      </div>
      <div>
        <p>Loading...</p>
      </div>
    </div>,
  ),
  <div className="flex h-screen flex-col items-center justify-center bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
    <div>
      <CircleXIcon size={48} className="mb-2" />
    </div>
    <div>
      <p>An error occurred</p>
    </div>
  </div>,
);
