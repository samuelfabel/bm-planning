interface FormFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

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
  'w-full px-3 py-2 text-sm border border-bm-border rounded-md bg-white text-bm-textDark placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue transition-colors';

export const selectClass =
  'w-full px-3 py-2 text-sm border border-bm-border rounded-md bg-white text-bm-textDark focus:outline-none focus:ring-2 focus:ring-bm-blue/30 focus:border-bm-blue transition-colors';

export function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-white shadow-sm border border-bm-border rounded-md ${className}`}>
      <div className="px-5 py-3.5 border-b border-bm-border">
        <h2 className="text-sm font-semibold text-bm-textDark">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  );
}

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
      className={`border border-bm-border bg-white hover:bg-bm-board text-bm-textDark px-4 py-2 rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
