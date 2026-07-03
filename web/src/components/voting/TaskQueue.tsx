import type { QueuedCard } from '@/types/planning';

interface TaskQueueProps {
  queue: QueuedCard[];
  currentIdx: number;
  onSelect?: (idx: number) => void;
}

export function TaskQueue({ queue, currentIdx, onSelect }: TaskQueueProps) {
  return (
    <aside className="w-full lg:w-72 shrink-0 bg-bm-board border-r border-bm-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-bm-border bg-white">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted">
          Fila de Tarefas
        </h3>
        <p className="text-sm text-bm-textDark mt-0.5">
          {currentIdx + 1} de {queue.length}
        </p>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {queue.map((card, idx) => {
          const isActive = idx === currentIdx;
          const isDone = Boolean(card.estimated);

          return (
            <li key={card.cardId}>
              <button
                type="button"
                onClick={() => onSelect?.(idx)}
                className={`w-full text-left rounded-md border transition-all ${
                  isActive
                    ? 'bg-white border-bm-blue shadow-sm ring-1 ring-bm-blue/20'
                    : 'bg-white border-bm-border hover:border-slate-300'
                }`}
              >
                <div className="flex">
                  <div
                    className="w-1 shrink-0 rounded-l-md"
                    style={{ backgroundColor: `#${card.color}` }}
                  />
                  <div className="flex-1 px-3 py-2.5 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-bm-textMuted">#{card.cardId}</span>
                      {isDone && (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {card.estimated}
                        </span>
                      )}
                      {isActive && !isDone && (
                        <span className="text-[10px] font-medium text-bm-blue bg-blue-50 px-1.5 py-0.5 rounded">
                          ATIVO
                        </span>
                      )}
                    </div>
                    {card.customId && (
                      <span className="text-[11px] text-bm-blue font-medium">{card.customId}</span>
                    )}
                    <p className={`text-sm mt-0.5 truncate ${isActive ? 'font-medium text-bm-textDark' : 'text-bm-textMuted'}`}>
                      {card.title}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
