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
} from 'lucide-react';
import { RegexFilter } from './components/RegexFilter';

type Props = {
  messages: PostMessage[];
  onClear: () => void;
  paused: boolean;
  onTogglePause: () => void;
};

function Panel({ messages, paused, onClear, onTogglePause }: Props) {
  const [sortAscending, setSortAscending] = useState(false);
  const [prettifyJson, setPrettifyJson] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [originFilter, setOriginFilter] = useState<string>('');
  const [destinationFilter, setDestinationFilter] = useState<string>('');
  const [dataFilter, setDataFilter] = useState<string>('');
  const [originFilterExpression, setOriginFilterExpression] = useState<RegExp | null>(null);
  const [destinationFilterExpression, setDestinationFilterExpression] = useState<RegExp | null>(null);
  const [dataFilterExpression, setDataFilterExpression] = useState<RegExp | null>(null);

  function handleFilterToggle(show: boolean) {
    setShowFilters(show);
    if (!show) {
      setOriginFilter('');
      setDataFilter('');
      setDestinationFilter('');
      setOriginFilterExpression(null);
      setDataFilterExpression(null);
      setDestinationFilterExpression(null);
    }
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

  const sortedMessages = messages.slice().sort((a, b) => {
    const diff = a.timestamp - b.timestamp;
    return sortAscending ? diff : -diff;
  });

  const filteredMessages = sortedMessages.filter(message => {
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
  });

  const hasFilters = originFilterExpression != null || dataFilterExpression != null;

  return (
    <div className="flex h-screen w-full flex-col items-center overflow-hidden">
      <div className="flex w-full items-center gap-3 border-b border-zinc-600 p-1 dark:bg-zinc-800">
        <div className="flex-1">
          <p className="text-zinc-800 dark:text-gray-300">
            {hasFilters ? (
              <span>
                {filteredMessages.length} matching ({messages.length} total)
              </span>
            ) : (
              <span>{messages.length} messages</span>
            )}
          </p>
        </div>

        <div className="flex gap-1">
          <button
            className="rounded p-1 text-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            title={prettifyJson ? 'Disable prettify' : 'Enable prettify'}
            onClick={() => setPrettifyJson(v => !v)}>
            {prettifyJson ? <SparkleIcon size={14} /> : <SparklesIcon size={14} />}
          </button>

          <button
            className="rounded p-1 text-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            title={sortAscending ? 'Oldest first' : 'Newest first'}
            onClick={() => setSortAscending(!sortAscending)}>
            {sortAscending ? <SortAscIcon size={14} /> : <SortDescIcon size={14} />}
          </button>

          <button
            className="rounded p-1 text-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            onClick={() => onTogglePause()}
            title={paused ? 'Start listening' : 'Stop listening'}>
            {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
          </button>

          <button
            className="rounded p-1 text-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            title={'Clear log'}
            onClick={onClear}>
            <BanIcon size={14} />
          </button>

          <button
            className="rounded p-1 text-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
            title={'Clear log'}
            onClick={() => handleFilterToggle(!showFilters)}>
            {showFilters ? <FilterXIcon size={14} /> : <FilterIcon size={14} />}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="flex w-full flex-col gap-1 border-b border-zinc-600 px-1 py-[6px] dark:bg-zinc-800">
          <div className="flex gap-1">
            <RegexFilter
              value={originFilter}
              onValueChange={setOriginFilter}
              onFilterChange={filter => setOriginFilterExpression(filter)}
              placeholder="Filter by origin"
            />

            <RegexFilter
              value={destinationFilter}
              onValueChange={setDestinationFilter}
              onFilterChange={filter => setDestinationFilterExpression(filter)}
              placeholder="Filter by destination"
            />
          </div>
          <RegexFilter
            value={dataFilter}
            onValueChange={setDataFilter}
            onFilterChange={filter => setDataFilterExpression(filter)}
            placeholder="Filter by data"
          />
        </div>
      )}

      <div className="min-h-0 w-full flex-1 overflow-y-auto bg-gray-100 text-sm dark:bg-zinc-800">
        {filteredMessages.map((message, index) => (
          <div key={index} className="w-full border-b border-zinc-500 px-1 py-[10px] text-sm">
            <div className="mb-2 font-mono text-xs text-gray-500 dark:text-gray-200">
              {dayjs(message.datetime).format('YYYY-MM-DD HH:mm:ss')} (+{message.timestamp.toFixed()}ms)
            </div>

            <div className="mb-2 truncate font-mono text-xs font-bold text-gray-500 dark:text-gray-200">
              <span title={message.origin}>{message.origin}</span>
              <ArrowRightIcon size={16} className="mx-1 inline" />
              <span title={message.destination}>{message.destination}</span>
            </div>

            <code className="font-mono text-xs text-gray-500 dark:text-gray-200">
              <pre className="w-full whitespace-pre-wrap break-words">{formatJson(message.data)}</pre>
            </code>
          </div>
        ))}

        {filteredMessages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-gray-500">
            <div>
              <InboxIcon size={48} className="mb-2" />
            </div>
            <div>
              <p>No matching messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withErrorBoundary(
  withSuspense(
    Panel,
    <div className="flex h-full flex-col items-center justify-center text-gray-500">
      <div>
        <LoaderIcon size={48} className="mb-2 animate-spin duration-1000" />
      </div>
      <div>
        <p>Loading...</p>
      </div>
    </div>,
  ),
  <div className="flex h-full flex-col items-center justify-center text-gray-500">
    <div>
      <CircleXIcon size={48} className="mb-2" />
    </div>
    <div>
      <p>An error occurred</p>
    </div>
  </div>,
);
