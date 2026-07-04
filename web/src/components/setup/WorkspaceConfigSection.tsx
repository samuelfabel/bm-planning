import { useAuth, useApiCredentials } from '@/context/AuthContext';
import { useBusinessmapProxy } from '@/context/BusinessmapProxyContext';
import { CompanyLogoField } from './CompanyLogoField';
import { Card, FormField, inputClass, selectClass, Switch } from '@/components/ui/FormPrimitives';
import type { BusinessmapCustomField } from '@/types/businessmap';
import type { CustomFieldMapping, EstimationTargetKind } from '@/types/planning';

/** Map a Businessmap custom field to an estimation target mapping when supported.
 *
 * @param field - Custom field from the Businessmap catalog.
 * @returns Number or dropdown mapping, or null for unsupported types.
 */
function toCustomFieldMapping(field: BusinessmapCustomField): CustomFieldMapping | null {
  const type = field.type.toLowerCase();
  if (type === 'number') {
    return {
      fieldId: field.fieldId,
      fieldName: field.name,
      fieldType: 'number',
    };
  }
  if (type === 'dropdown') {
    return {
      fieldId: field.fieldId,
      fieldName: field.name,
      fieldType: 'dropdown',
      allowedValues: field.allowedValues?.map((v) => ({
        valueId: v.valueId,
        value: v.value,
      })),
    };
  }
  return null;
}

export function WorkspaceConfigSection() {
  const { workspace, saveWorkspace } = useAuth();
  const credentials = useApiCredentials();

  const { customFields, loadingCustomFields } = useBusinessmapProxy();

  const estimationKind = workspace.estimationTarget.kind ?? 'custom_field';
  const mappableFields = customFields
    .map(toCustomFieldMapping)
    .filter((f): f is CustomFieldMapping => f !== null);

  const handleCustomFieldChange = (fieldId: number) => {
    const field = mappableFields.find((f) => f.fieldId === fieldId);
    if (!field) return;
    saveWorkspace({
      customFieldMapping: field,
      estimationTarget: { kind: 'custom_field', customFieldMapping: field },
    });
  };

  const hasConnection = Boolean(credentials);

  return (
    <Card title="Workspace configuration">
      <p className="text-xs text-bm-textMuted -mt-2 mb-4">
        Shared settings for your team&apos;s Businessmap workspace — logo, subdomain, and where
        estimates are saved.
      </p>

      <CompanyLogoField />

      <FormField label="Businessmap subdomain" hint="E.g. mycompany → mycompany.businessmap.io">
        <input
          type="text"
          className={inputClass}
          placeholder="mycompany"
          value={workspace.subdomain}
          onChange={(e) => saveWorkspace({ subdomain: e.target.value.trim() })}
        />
      </FormField>

      <FormField
        label="During the session"
        hint="Facilitator-only controls in the voting room"
      >
        <div className="space-y-4">
          <Switch
            id="allow-description-edit"
            checked={workspace.allowDescriptionEdit}
            onChange={(checked) => saveWorkspace({ allowDescriptionEdit: checked })}
            label="Allow editing task description"
            description="Refine context on the active card before the team votes"
          />
          <Switch
            id="show-subtasks"
            checked={workspace.showSubtasks}
            onChange={(checked) =>
              saveWorkspace({
                showSubtasks: checked,
                ...(checked ? {} : { allowSubtasks: false }),
              })
            }
            label="Show subtasks"
            description="Display checklist items from Businessmap on the active card"
          />
          <Switch
            id="allow-subtasks"
            checked={workspace.allowSubtasks}
            onChange={(checked) => saveWorkspace({ allowSubtasks: checked })}
            label="Allow adding subtasks"
            description="Break down the active card into checklist items during planning"
            disabled={!workspace.showSubtasks}
          />
        </div>
      </FormField>

      <FormField label="Where to save the estimate in Businessmap">
        <select
          className={selectClass}
          value={estimationKind}
          onChange={(e) => {
            const kind = e.target.value as EstimationTargetKind;
            saveWorkspace({
              estimationTarget: {
                kind,
                customFieldMapping:
                  kind === 'custom_field' ? workspace.customFieldMapping : undefined,
              },
            });
          }}
        >
          <option value="custom_field">Custom field</option>
          <option value="native_size">Card native Size field</option>
        </select>
      </FormField>

      {estimationKind === 'custom_field' && (
        <FormField label="Custom field" hint="Story Points, Effort, etc.">
          {!hasConnection && (
            <p className="text-xs text-bm-textMuted mb-2">
              Set your profile API key and workspace subdomain to load fields from Businessmap.
            </p>
          )}
          <select
            className={selectClass}
            value={workspace.customFieldMapping?.fieldId ?? ''}
            disabled={!hasConnection || loadingCustomFields}
            onChange={(e) => {
              const id = Number(e.target.value);
              if (id) handleCustomFieldChange(id);
            }}
          >
            <option value="">
              {loadingCustomFields
                ? 'Loading fields…'
                : !hasConnection
                  ? 'Connect to load fields'
                  : mappableFields.length === 0
                    ? 'No number/dropdown fields found'
                    : 'Select a field…'}
            </option>
            {mappableFields.map((f) => (
              <option key={f.fieldId} value={f.fieldId}>
                {f.fieldName} ({f.fieldType})
              </option>
            ))}
          </select>
        </FormField>
      )}

      {estimationKind === 'native_size' && (
        <p className="text-xs text-bm-textMuted -mt-2 mb-2">
          Estimates will be written to the card&apos;s native Size field (Businessmap API).
        </p>
      )}
    </Card>
  );
}
