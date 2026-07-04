import type { DemoPersona } from '@/types/planning';

interface DemoRoleSwitcherProps {
  value: DemoPersona;
  onChange: (persona: DemoPersona) => void;
}

const OPTIONS: { value: DemoPersona; label: string; hint: string }[] = [
  { value: 'croupier', label: 'Croupier', hint: 'Run the session' },
  { value: 'participant', label: 'Participant', hint: 'Cast a vote' },
];

/** Toggle between croupier and participant views in demo mode.
 *
 * @param props - {@link DemoRoleSwitcherProps}
 * @returns React element.
 */
export function DemoRoleSwitcher({ value, onChange }: DemoRoleSwitcherProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-bm-textMuted">
        Demo view
      </span>
      <div
        className="inline-flex rounded-md border border-bm-border bg-bm-board p-0.5"
        role="group"
        aria-label="Demo role"
      >
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              title={opt.hint}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                active
                  ? 'bg-bm-surface text-bm-textDark shadow-sm'
                  : 'text-bm-textMuted hover:text-bm-textDark'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
