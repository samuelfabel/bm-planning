import { useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BrandMark } from '@/components/layout/BrandMark';
import { FormField } from '@/components/ui/FormPrimitives';

const MAX_LOGO_BYTES = 512 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

async function readLogoFile(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error('Use PNG, JPG, WebP or SVG.');
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error('Logo must be under 512 KB.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read the file.'));
    reader.readAsDataURL(file);
  });
}

export function CompanyLogoField() {
  const { workspace, saveWorkspace } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const dataUrl = await readLogoFile(file);
      saveWorkspace({ companyLogoUrl: dataUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload logo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormField
      label="Company logo"
      hint="Shown in the header. PNG, JPG, WebP or SVG — max 512 KB. Stored in this browser only."
    >
      <div className="flex items-center gap-4">
        <BrandMark logoUrl={workspace.companyLogoUrl} className="h-10 w-10" />

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="sr-only"
            onChange={handleFileChange}
          />
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-bm-blue border border-bm-blue/30 hover:bg-bm-accentSoft disabled:opacity-50 px-3 py-1.5 rounded-md transition-colors"
          >
            {loading ? 'Uploading…' : workspace.companyLogoUrl ? 'Replace logo' : 'Upload logo'}
          </button>
          {workspace.companyLogoUrl && (
            <button
              type="button"
              onClick={() => {
                saveWorkspace({ companyLogoUrl: null });
                setError(null);
              }}
              className="text-sm font-medium text-bm-textMuted hover:text-red-600 px-3 py-1.5 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </FormField>
  );
}
