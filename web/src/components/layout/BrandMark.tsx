interface BrandMarkProps {
  logoUrl?: string | null;
  className?: string;
}

/** Company logo or default BM monogram for header branding.
 *
 * @param props - {@link BrandMarkProps}
 * @returns React element.
 */
export function BrandMark({ logoUrl, className = '' }: BrandMarkProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Company logo"
        className={`h-7 w-7 rounded-md object-contain bg-white/10 shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`h-7 w-7 rounded-md bg-bm-blue flex items-center justify-center text-white text-xs font-bold shrink-0 ${className}`}
    >
      BM
    </div>
  );
}
