interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

/** Labeled form field wrapper with optional hint text.
 *
 * @param props - {@link FormFieldProps}
 * @returns React element.
 */
export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-bm-textDark">{label}</label>
      {children}
      {hint && <p className="text-xs text-bm-textMuted">{hint}</p>}
    </div>
  );
}

export const inputClass =
  'w-full px-3 py-2 text-sm border border-bm-border rounded-md bg-bm-surface text-bm-textDark placeholder:text-bm-placeholder focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue transition-colors';

export const textareaClass = `${inputClass} min-h-[5.5rem] resize-y leading-relaxed`;

export const selectClass =
  'w-full px-3 py-2 text-sm border border-bm-border rounded-md bg-bm-surface text-bm-textDark focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue transition-colors';

/** Bordered card section with a title header and padded body.
 *
 * @param title - Section heading shown in the card header.
 * @param children - Card body content.
 * @param className - Optional extra Tailwind classes for the outer section.
 * @returns React element.
 */
export function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-bm-surface shadow-sm border border-bm-border rounded-md ${className}`}>
      <div className="px-5 py-3.5 border-b border-bm-border">
        <h2 className="text-sm font-semibold text-bm-textDark">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

/** Primary action button styled with the BM blue palette.
 *
 * @param children - Button label or content.
 * @param onClick - Optional click handler.
 * @param disabled - When true, disables interaction and dims the button.
 * @param className - Optional extra Tailwind classes.
 * @returns React element.
 */
export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`bg-bm-blue hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/** Secondary outline button for non-primary actions.
 *
 * @param children - Button label or content.
 * @param onClick - Optional click handler.
 * @param className - Optional extra Tailwind classes.
 * @returns React element.
 */
export function SecondaryButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-bm-border bg-bm-surface hover:bg-bm-surfaceHover text-bm-textDark px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

/** Accessible toggle switch with label and optional description.
 *
 * @param props - {@link SwitchProps}
 * @returns React element.
 */
export function Switch({ checked, onChange, label, description, id, disabled }: SwitchProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start justify-between gap-4 group ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm text-bm-textDark">{label}</span>
        {description && (
          <span className="block text-xs text-bm-textMuted mt-0.5">{description}</span>
        )}
      </span>
      <span className="relative inline-flex h-5 w-9 shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <span className="absolute inset-0 rounded-full bg-bm-switchTrack transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-bm-blue/30 peer-checked:bg-bm-blue" />
        <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-bm-surface shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
    </label>
  );
}
