import type { QueuedCard } from '@/types/planning';

interface ActiveCardProps {
  card: QueuedCard;
}

export function ActiveCard({ card }: ActiveCardProps) {
  return (
    <div className="bg-white border border-bm-border rounded-md shadow-sm overflow-hidden">
      <div className="flex">
        <div
          className="w-1.5 shrink-0"
          style={{ backgroundColor: `#${card.color}` }}
        />
        <div className="flex-1 p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono text-bm-textMuted">#{card.cardId}</span>
            {card.customId && (
              <span className="text-sm font-semibold text-bm-blue">{card.customId}</span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-bm-textDark leading-snug">
            {card.title}
          </h2>
          {card.description && (
            <p className="text-sm text-bm-textMuted mt-3 leading-relaxed max-w-3xl">
              {card.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
