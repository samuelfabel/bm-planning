interface DeckRowProps {
  values: string[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

/** Horizontal row of deck buttons for casting a vote.
 *
 * @param props - {@link DeckRowProps}
 * @returns React element.
 */
export function DeckRow({ values, selectedValue, onSelect, disabled }: DeckRowProps) {
  return (
    <div className="bg-bm-surface border-t border-bm-border px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-bm-textMuted mb-2.5">
        Your vote
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {values.map((value) => {
          const isSelected = selectedValue === value;
          return (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(value)}
              className={`min-w-[3rem] h-14 px-3 rounded-md border-2 text-lg font-bold transition-all ${
                isSelected
                  ? 'border-bm-blue bg-bm-blue text-white shadow-md scale-105'
                  : 'border-bm-blue/40 bg-bm-surface text-bm-blue hover:border-bm-blue hover:bg-bm-accentSoft hover:shadow-sm'
              } disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-bm-surface disabled:hover:shadow-none`}
            >
              {value}
            </button>
          );
        })}
      </div>
    </div>
  );
}
