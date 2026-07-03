import { useAuth } from '@/context/AuthContext';
import { Card, FormField, inputClass, selectClass, Switch } from '@/components/ui/FormPrimitives';
import type { FacilitatorRole } from '@/types/planning';

export function PersonConfigSection() {
  const { profile, saveProfile } = useAuth();

  return (
    <Card title="Your profile">
      <p className="text-xs text-bm-textMuted -mt-2 mb-4">
        Personal settings for this browser session. The API key identifies you in Businessmap — it is
        never sent to our server.
      </p>

      <FormField
        label="API Key"
        hint="Your Businessmap personal API key — defines who is logged in"
      >
        <input
          type="password"
          className={inputClass}
          placeholder="••••••••••••••••"
          value={profile.apiKey}
          onChange={(e) => saveProfile({ apiKey: e.target.value })}
          autoComplete="off"
        />
      </FormField>

      <FormField label="Your name" hint="Shown to other participants in the voting room">
        <input
          type="text"
          className={inputClass}
          placeholder="Jane Smith"
          value={profile.displayName}
          onChange={(e) => saveProfile({ displayName: e.target.value })}
        />
      </FormField>

      <FormField
        label="Your role when hosting"
        hint="When you create a room from Setup, this is your role. Croupier facilitates and picks tasks without voting; Participant hosts and votes too. Others who join the room will be participants only (planned for M2)."
      >
        <select
          className={selectClass}
          value={profile.facilitatorRole}
          onChange={(e) =>
            saveProfile({ facilitatorRole: e.target.value as FacilitatorRole })
          }
        >
          <option value="croupier">Croupier — I facilitate, others vote</option>
          <option value="participant">Participant — I host and join the vote</option>
        </select>
      </FormField>

      <FormField
        label="Appearance"
        hint="Personal preference for this browser — not shared with your team"
      >
        <Switch
          id="night-mode"
          checked={profile.nightMode}
          onChange={(checked) => saveProfile({ nightMode: checked })}
          label="Night mode"
          description="Dark background and softer contrast across the app"
        />
      </FormField>

      <div className="rounded-md border border-bm-border bg-bm-board px-3 py-2.5 text-xs text-bm-textMuted leading-relaxed">
        <p className="font-medium text-bm-textDark mb-1">Who is the Croupier?</p>
        <p>
          The person who creates the planning room and runs the session — selecting the active task,
          starting rounds, and revealing votes. In the <strong>demo</strong>, use the Croupier /
          Participant toggle in the room toolbar to preview both views.
        </p>
      </div>
    </Card>
  );
}
