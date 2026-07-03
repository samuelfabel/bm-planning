import { useAuth } from '@/context/AuthContext';
import { MOCK_CUSTOM_FIELDS, DECK_PRESETS } from '@/mocks/config';
import { Card, FormField, inputClass, selectClass } from '@/components/ui/FormPrimitives';
import type { DeckType } from '@/types/planning';

export function ApiConfigSection() {
  const { config, saveConfig } = useAuth();

  return (
    <Card title="Configuração da API">
      <FormField label="Subdomínio Businessmap" hint="Ex: minhaempresa → minhaempresa.businessmap.io">
        <input
          type="text"
          className={inputClass}
          placeholder="minhaempresa"
          value={config?.subdomain ?? ''}
          onChange={(e) => saveConfig({ subdomain: e.target.value.trim() })}
        />
      </FormField>

      <FormField label="API Key" hint="Salva apenas nesta sessão do navegador (sessionStorage)">
        <input
          type="password"
          className={inputClass}
          placeholder="••••••••••••••••"
          value={config?.apiKey ?? ''}
          onChange={(e) => saveConfig({ apiKey: e.target.value })}
        />
      </FormField>

      <FormField label="Seu nome (facilitador)">
        <input
          type="text"
          className={inputClass}
          placeholder="Ana Silva"
          value={config?.facilitatorDisplayName ?? ''}
          onChange={(e) => saveConfig({ facilitatorDisplayName: e.target.value })}
        />
      </FormField>

      <FormField label="Campo personalizado para estimativa" hint="Onde os Story Points serão salvos no Businessmap">
        <select
          className={selectClass}
          value={config?.customFieldMapping?.fieldId ?? ''}
          onChange={(e) => {
            const field = MOCK_CUSTOM_FIELDS.find((f) => f.fieldId === Number(e.target.value));
            if (field) {
              saveConfig({
                customFieldMapping: {
                  fieldId: field.fieldId,
                  fieldName: field.name,
                  fieldType: field.type === 'dropdown' ? 'dropdown' : 'number',
                  allowedValues: field.allowedValues?.map((v) => ({
                    valueId: v.valueId,
                    value: v.value,
                  })),
                },
              });
            }
          }}
        >
          <option value="">Selecione um campo…</option>
          {MOCK_CUSTOM_FIELDS.map((f) => (
            <option key={f.fieldId} value={f.fieldId}>
              {f.name} ({f.type})
            </option>
          ))}
        </select>
      </FormField>

      <FormField label="Tipo de baralho">
        <select
          className={selectClass}
          value={config?.deck.type ?? 'fibonacci'}
          onChange={(e) => {
            const type = e.target.value as DeckType;
            saveConfig({
              deck: {
                type,
                values: DECK_PRESETS[type] ?? DECK_PRESETS.fibonacci,
                allowPass: true,
                allowBreak: false,
              },
            });
          }}
        >
          <option value="fibonacci">Fibonacci</option>
          <option value="sequential">Sequencial (1–10)</option>
          <option value="tshirt">T-Shirt (XS–XXL)</option>
        </select>
      </FormField>

      {config?.deck.values && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {config.deck.values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 text-xs font-medium border border-bm-border rounded bg-bm-board text-bm-textMuted"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
