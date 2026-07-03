import { DECK_PRESETS } from '@/mocks/config';
import { FormField, inputClass, selectClass } from '@/components/ui/FormPrimitives';
import type { DeckType, SessionSettings } from '@/types/planning';

interface RoomSettingsFieldsProps {
  settings: SessionSettings;
  onChange: (partial: Partial<SessionSettings>) => void;
}

function deckValuesForType(type: DeckType, current: SessionSettings['deck']): string[] {
  if (type === 'custom' && current.type === 'custom') {
    return current.values;
  }
  return DECK_PRESETS[type] ?? DECK_PRESETS.fibonacci;
}

function parseCustomDeckInput(raw: string): string[] {
  return raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function RoomSettingsFields({ settings, onChange }: RoomSettingsFieldsProps) {
  const isCustomDeck = settings.deck.type === 'custom';

  return (
    <div className="space-y-4">
      <FormField
        label="Consensus suggestion"
        hint="After revealing votes, how to calculate the suggested card"
      >
        <select
          className={selectClass}
          value={settings.consensusAlgorithm}
          onChange={(e) =>
            onChange({
              consensusAlgorithm: e.target.value as SessionSettings['consensusAlgorithm'],
            })
          }
        >
          <option value="average_nearest">Average → nearest card</option>
          <option value="median_nearest">Median → nearest card</option>
          <option value="manual">No automatic suggestion</option>
        </select>
      </FormField>

      <FormField label="Value written to Businessmap">
        <select
          className={selectClass}
          value={settings.syncValueSource}
          onChange={(e) =>
            onChange({
              syncValueSource: e.target.value as SessionSettings['syncValueSource'],
            })
          }
        >
          <option value="nearest_card">Deck card (e.g. 8)</option>
          <option value="raw_average">Arithmetic mean (e.g. 7.3)</option>
        </select>
      </FormField>

      <FormField label="Deck type">
        <select
          className={selectClass}
          value={settings.deck.type}
          onChange={(e) => {
            const type = e.target.value as DeckType;
            onChange({
              deck: {
                type,
                values: deckValuesForType(type, settings.deck),
                allowPass: true,
                allowBreak: false,
              },
            });
          }}
        >
          <option value="fibonacci">Fibonacci</option>
          <option value="sequential">Sequential (1–10)</option>
          <option value="tshirt">T-Shirt (XS–XXL)</option>
          <option value="custom">Custom</option>
        </select>
      </FormField>

      {isCustomDeck && (
        <FormField
          label="Custom cards"
          hint="Comma-separated values — e.g. 1, 2, 3, 5, 8, ?"
        >
          <input
            type="text"
            className={inputClass}
            value={settings.deck.values.join(', ')}
            onChange={(e) => {
              const values = parseCustomDeckInput(e.target.value);
              onChange({
                deck: {
                  ...settings.deck,
                  type: 'custom',
                  values: values.length > 0 ? values : settings.deck.values,
                },
              });
            }}
            placeholder="1, 2, 3, 5, 8, 13, ?"
          />
        </FormField>
      )}

      {settings.deck.values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {settings.deck.values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 text-xs font-medium border border-bm-border rounded bg-bm-board text-bm-textMuted"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
