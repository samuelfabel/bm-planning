import type { QueuedCard } from '@/types/planning';

interface TaskQueueProps {
  queue: QueuedCard[];
  currentIdx: number;
  onSelect?: (idx: number) => void;
  /** Croupier can pick the active task from the queue */
  facilitatorMode?: boolean;
  showSubtasks?: boolean;
  /** Full queue indices for mapping when queue is filtered */
  queueIndices?: number[];
  onToggleExcluded?: (idx: number) => void;
}

function cardColor(hex: string) {
  return `#${hex.replace(/^#/, '')}`;
}

function QueueItem({
  card,
  idx,
  isActive,
  isDone,
  onSelect,
  onToggleExcluded,
}: {
  card: QueuedCard;
  idx: number;
  isActive: boolean;
  isDone: boolean;
  onSelect?: (idx: number) => void;
  onToggleExcluded?: () => void;
}) {
  const Wrapper = onSelect ? 'button' : 'div';
  const excluded = Boolean(card.excludedFromVoting);

  return (
    <div className="relative group">
    <Wrapper
      type={onSelect ? 'button' : undefined}
      onClick={onSelect ? () => onSelect(idx) : undefined}
      className={`w-full text-left rounded-md border transition-all ${
        isActive
          ? 'bg-bm-surface border-bm-blue shadow-sm ring-1 ring-bm-blue/20'
          : 'bg-bm-surface border-bm-border hover:border-bm-textMuted/40'
      } ${excluded ? 'opacity-60' : ''}`}
    >
      <div className="flex">
        <div
          className="w-1 shrink-0 rounded-l-md"
          style={{ backgroundColor: cardColor(card.color) }}
        />
        <div className="flex-1 px-3 py-2.5 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-bm-textMuted">#{card.cardId}</span>
            {isDone && (
              <span className="text-xs font-semibold text-bm-successText bg-bm-successSoft px-1.5 py-0.5 rounded">
                {card.estimated}
              </span>
            )}
            {isActive && !isDone && (
              <span className="text-[10px] font-medium text-bm-blue bg-bm-accentSoft px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            )}
            {excluded && (
              <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded">
                DEFERRED
              </span>
            )}
          </div>
          {card.customId && (
            <span className="text-[11px] text-bm-blue font-medium">{card.customId}</span>
          )}
          <p
            className={`text-sm mt-0.5 truncate ${
              isActive ? 'font-medium text-bm-textDark' : 'text-bm-textMuted'
            } ${excluded ? 'line-through' : ''}`}
          >
            {card.title}
          </p>
        </div>
      </div>
    </Wrapper>
    {onToggleExcluded && (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExcluded();
        }}
        title={excluded ? 'Include in voting' : 'Exclude from voting'}
        aria-label={excluded ? 'Include in voting' : 'Exclude from voting'}
        className="absolute right-2 top-2 p-1 rounded text-bm-textMuted hover:text-bm-textDark opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
      >
        {excluded ? (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        )}
      </button>
    )}
    </div>
  );
}

function MobileTaskCarousel({
  queue,
  currentIdx,
  onSelect,
  showSubtasks = false,
  onToggleExcluded,
}: {
  queue: QueuedCard[];
  currentIdx: number;
  onSelect?: (idx: number) => void;
  showSubtasks?: boolean;
  onToggleExcluded?: (idx: number) => void;
}) {
  const card = queue[currentIdx];
  if (!card) return null;

  const isDone = Boolean(card.estimated);
  const excluded = Boolean(card.excludedFromVoting);
  const canGoPrev = Boolean(onSelect && currentIdx > 0);
  const canGoNext = Boolean(onSelect && currentIdx < queue.length - 1);

  return (
      <div className="lg:hidden shrink-0 border-b border-bm-border bg-bm-board">
        <div className="px-3 py-2 flex items-center justify-between bg-bm-surface border-b border-bm-border">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
              Current task
            </h3>
            {onSelect && (
              <p className="text-[10px] text-bm-textMuted mt-0.5">Use arrows to change focus</p>
            )}
          </div>
        <span className="text-xs text-bm-textMuted tabular-nums">
          {currentIdx + 1} of {queue.length}
        </span>
      </div>

      <div className="flex justify-center gap-1.5 px-3 pt-2.5" aria-hidden>
        {queue.map((_, idx) => (
          <span
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIdx ? 'w-5 bg-bm-blue' : 'w-1.5 bg-bm-dotInactive'
            }`}
          />
        ))}
      </div>

      <div className="flex items-stretch gap-1 px-2 py-2.5">
        {onSelect && (
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => onSelect(currentIdx - 1)}
            aria-label="Previous task"
            className="shrink-0 self-center p-2 rounded-md text-bm-textMuted hover:text-bm-textDark hover:bg-bm-surface/80 disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        <div
          key={card.cardId}
          className="flex-1 min-w-0 bg-bm-surface border border-bm-blue rounded-md shadow-sm ring-1 ring-bm-blue/20 overflow-hidden animate-[fadeSlideIn_0.25s_ease-out]"
        >
          <div className="flex">
            <div className="w-1.5 shrink-0" style={{ backgroundColor: cardColor(card.color) }} />
            <div className="flex-1 p-3 min-w-0">
              <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                <span className="text-xs font-mono text-bm-textMuted">#{card.cardId}</span>
                {card.customId && (
                  <span className="text-xs font-semibold text-bm-blue">{card.customId}</span>
                )}
                {isDone ? (
                  <span className="text-[10px] font-semibold text-bm-successText bg-bm-successSoft px-1.5 py-0.5 rounded">
                    {card.estimated}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-bm-blue bg-bm-accentSoft px-1.5 py-0.5 rounded">
                    ACTIVE
                  </span>
                )}
                {excluded && (
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded">
                    DEFERRED
                  </span>
                )}
              </div>
              <p className={`text-sm font-semibold text-bm-textDark leading-snug line-clamp-2 ${excluded ? 'line-through opacity-80' : ''}`}>
                {card.title}
              </p>
              {onToggleExcluded && (
                <button
                  type="button"
                  onClick={() => onToggleExcluded(currentIdx)}
                  className="mt-2 text-[11px] font-medium text-bm-textMuted hover:text-bm-textDark"
                >
                  {excluded ? 'Include in voting' : 'Exclude from voting'}
                </button>
              )}
              {showSubtasks && (card.subtasks?.length ?? 0) > 0 && (
                <p className="text-[11px] text-bm-textMuted mt-1">
                  {card.subtasks?.filter((s) => s.done).length ?? 0}/{card.subtasks?.length ?? 0}{' '}
                  subtasks
                </p>
              )}
            </div>
          </div>
        </div>

        {onSelect && (
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => onSelect(currentIdx + 1)}
            aria-label="Next task"
            className="shrink-0 self-center p-2 rounded-md text-bm-textMuted hover:text-bm-textDark hover:bg-bm-surface/80 disabled:opacity-30 disabled:pointer-events-none"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export function TaskQueue({
  queue,
  currentIdx,
  onSelect,
  facilitatorMode,
  showSubtasks,
  queueIndices,
  onToggleExcluded,
}: TaskQueueProps) {
  const resolveIdx = (displayIdx: number) => queueIndices?.[displayIdx] ?? displayIdx;
  const isActiveAt = (displayIdx: number) => resolveIdx(displayIdx) === currentIdx;

  return (
    <>
      <MobileTaskCarousel
        queue={queue}
        currentIdx={queueIndices ? queue.findIndex((_, i) => resolveIdx(i) === currentIdx) : currentIdx}
        onSelect={onSelect ? (displayIdx) => onSelect(resolveIdx(displayIdx)) : undefined}
        showSubtasks={showSubtasks}
        onToggleExcluded={onToggleExcluded ? (displayIdx) => onToggleExcluded(resolveIdx(displayIdx)) : undefined}
      />

      <aside className="hidden lg:flex lg:w-72 shrink-0 bg-bm-board border-r border-bm-border flex-col h-full">
        <div className="px-4 py-3 border-b border-bm-border bg-bm-surface">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
            Task queue
          </h3>
          <p className="text-sm text-bm-textDark mt-0.5">
            {queueIndices
              ? `${queue.findIndex((_, i) => resolveIdx(i) === currentIdx) + 1} of ${queue.length} votable`
              : `${currentIdx + 1} of ${queue.length}`}
          </p>
          {facilitatorMode && (
            <p className="text-[10px] text-bm-textMuted mt-1 leading-snug">
              Click a task to set the active card for discussion
            </p>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {queue.map((card, displayIdx) => {
            const idx = resolveIdx(displayIdx);
            return (
            <li key={card.cardId}>
              <QueueItem
                card={card}
                idx={idx}
                isActive={isActiveAt(displayIdx)}
                isDone={Boolean(card.estimated)}
                onSelect={onSelect}
                onToggleExcluded={onToggleExcluded ? () => onToggleExcluded(idx) : undefined}
              />
            </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
